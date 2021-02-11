/*
 *  Copyright 2021 Artificial Intelligence Redefined <dev+cogment@ai-r.com>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

import {grpc} from '@improbable-eng/grpc-web';
import {Message} from 'google-protobuf';
import {Any as AnyPb} from 'google-protobuf/google/protobuf/any_pb';
import {
  CogSettings,
  CogSettingsActorClass,
  Event,
  Reward,
  TrialActor,
} from '../types';
import {Action as ActionPb, Message as CogMessage} from './api/common_pb';
import {
  TrialActionReply,
  TrialActionRequest,
  TrialMessageRequest,
} from './api/orchestrator_pb';
import {ActorEndpointClient} from './api/orchestrator_pb_service';
import {deserializeData} from './lib/DeltaEncoding';
import {getLogger} from './lib/Logger';
import {SendMessageReturnType} from './TrialController';

const logger = getLogger('ActorSession');

export class ActorSession<
  ActionT extends Message,
  ObservationT extends Message,
  RewardT extends Message,
  MessageT extends Message
> {
  private actorCogSettings: CogSettingsActorClass;
  private events: Event<ObservationT, RewardT, MessageT>[] = [];
  private lastObservation?: ObservationT;
  private nextEventPromise?: Promise<void>;
  private nextEventResolve?: () => void;
  private running = false;
  private tickId?: number;

  // eslint-disable-next-line max-params
  constructor(
    private actorClass: TrialActor,
    private cogSettings: CogSettings,
    private actorEndpointClient: ActorEndpointClient,
    private actionStreamClient: grpc.Client<
      TrialActionRequest,
      TrialActionReply
    >,
  ) {
    this.actorCogSettings = cogSettings.actor_classes[actorClass.actorClass];

    this.actionStreamClient.onMessage(this.onActionStreamMessage);
    this.actionStreamClient.onHeaders(this.onActionStreamHeaders);
    this.actionStreamClient.onEnd(this.onActionStreamEnd);

    // eslint-disable-next-line compat/compat
    this.nextEventPromise = new Promise((resolve) => {
      this.nextEventResolve = resolve;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addFeedback(to: string[], feedback: Reward): void {
    throw new Error('addFeedback() is not implemented.');
  }

  public async *eventLoop(): AsyncGenerator<
    Event<ObservationT, RewardT, MessageT>
  > {
    if (!this.running) {
      logger.warn('Trial is not currently running.');
    }
    while (this.running) {
      const event = this.events.shift();
      if (event) {
        logger.debug(
          `Dispatching event for tick id ${
            event.tickId?.toString() ?? ''
          } ${JSON.stringify(event, undefined, 2)}`,
        );
        // TODO: think through the logic on this one
        if (event.observation) {
          this.lastObservation = event.observation;
        }
        yield event;
      } else {
        logger.trace('No events available');
        await this.nextEventPromise;
      }
    }
  }

  public getTickId(): number | undefined {
    return this.tickId;
  }

  public isTrialOver(): boolean {
    return typeof this.tickId !== 'undefined';
  }

  public sendAction(userAction: ActionT): void {
    const action = new ActionPb();
    action.setContent(userAction.serializeBinary());
    const request = new TrialActionRequest();
    request.setAction(action);
    this.actionStreamClient.send(request);
  }

  public async sendMessage<PayloadT extends Message>({
    from,
    to,
    payload,
    trialId,
    actorName,
  }: SendMessageOptions<PayloadT>): Promise<SendMessageReturnType> {
    const request = new TrialMessageRequest();
    const message = new CogMessage();

    message.setPayload(AnyPb.deserializeBinary(payload.serializeBinary()));
    message.setSenderName(from);
    message.setReceiverName(to);
    request.addMessages(message);
    // eslint-disable-next-line compat/compat
    return new Promise<SendMessageReturnType>((resolve, reject) => {
      this.actorEndpointClient.sendMessage(
        request,
        new grpc.Metadata({'trial-id': trialId, 'actor-name': actorName}),
        (error, response) => {
          if (error || response === null) {
            return reject(error);
          }
          resolve(response.toObject());
        },
      );
    });
  }

  public start(): void {
    this.running = true;
  }

  public stop(): void {
    this.running = false;
  }

  private onActionStreamEnd = (
    code: grpc.Code,
    message: string,
    trailers: grpc.Metadata,
    // eslint-disable-next-line max-params
  ) => {
    logger.info(
      `actionStream received end, code: ${code}, message: ${message}, trailers: ${JSON.stringify(
        trailers,
        undefined,
        2,
      )}`,
    );
    // TODO: should we implicitly set the trial to running here?
    this.running = false;
  };

  private onActionStreamHeaders = (headers: grpc.Metadata) => {
    logger.info(
      `actionStream received headers: ${JSON.stringify(headers, undefined, 2)}`,
    );
  };

  private onActionStreamMessage = (action: TrialActionReply) => {
    const data = action.getData();
    if (!data) {
      return logger.warn('Received an action without any data');
    }
    logger.trace(
      `Received a raw action ${JSON.stringify(
        action.toObject(),
        undefined,
        2,
      )}`,
    );

    // copy the protobuf array to prevent mutation
    const observations = [...data.getObservationsList()]
      // TODO: is this necessary?
      .filter((observation) => {
        return observation.getData()?.getContent() !== '';
      })
      .map((observation) => {
        return {
          tickId: observation.getTickId(),
          timestamp: observation.getTimestamp(),
          observation: deserializeData<ObservationT>({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            sourcePb: observation.getData(),
            destinationPb: this.actorCogSettings.observation_space,
          }),
        };
      });

    // copy the protobuf array to prevent mutation
    const messages = [...data.getMessagesList()].map((message) => ({
      tickId: message.getTickId(),
      message: {
        receiver: message.getReceiverName(),
        sender: message.getSenderName(),
        data: this.actorCogSettings.message_space?.deserializeBinary(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          /// @ts-ignore-next-line
          message?.getPayload()?.getValue_asU8(),
        ) as MessageT,
      },
    }));

    // copy the protobuf array to prevent mutation
    const rewards = [...data.getRewardsList()].map((reward) => ({
      tickId: reward.getFeedbacksList()[0].getTickId(),
      reward: {
        value: reward.getValue(),
        confidence: reward.getConfidence(),
        data: reward,
      },
    }));

    // sort all events by tickId - if an event object does not have a tickId, it gets placed at the front of the queue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.events = [
      ...this.events,
      ...observations,
      ...messages,
      ...rewards,
    ].sort(
      ({tickId: tickIdA}, {tickId: tickIdB}) => (tickIdA ?? 0) - (tickIdB ?? 0),
    );

    if (this.events[0]) {
      if (this.events[0]?.tickId) {
        this.tickId = this.events[0]?.tickId;
      }
      if (this.nextEventResolve) {
        this.nextEventResolve();
      }
      this.nextEventPromise = new Promise((resolve) => {
        this.nextEventResolve = resolve;
      });
    }
  };
}

export interface SendMessageOptions<PayloadT extends Message> {
  actorName: string;
  from: string;
  payload: PayloadT;
  to: string;
  trialId: string;
}
