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
import {CogSettings, TrialActor} from './@types/cogment';
import {ActorSession} from './ActorSession';
import {
  TrialConfig,
  VersionInfo,
  VersionRequest,
  Message as CogMessage,
} from './cogment/api/common_pb';
import {ServiceError} from './cogment/api/environment_pb_service';
import {
  TerminateTrialRequest,
  TrialActionReply,
  TrialActionRequest,
  TrialInfoReply,
  TrialInfoRequest,
  TrialJoinReply,
  TrialJoinRequest,
  TrialMessageReply,
  TrialMessageRequest,
  TrialStartReply,
  TrialStartRequest,
} from './cogment/api/orchestrator_pb';
import {
  ActorEndpointClient,
  TrialLifecycleClient,
} from './cogment/api/orchestrator_pb_service';
import {ActorImplementation} from './CogmentService';
import {getLogger} from './lib/Logger';
import {Any as AnyPb} from 'google-protobuf/google/protobuf/any_pb';

const logger = getLogger('TrialController');

export class TrialController {
  private trialId?: string;

  /**
   *
   * @param cogSettings - {@link CogSettings | `cog_settings.js`} generated file
   * @param actors - An array of [{@link TrialActor}, {@link ActorImplementation}] tuples
   * @param trialLifecycleClient - A {@link TrialLifecycleClient | `TrialLifecycleClient`}
   * @param actorEndpointClient - An {@link ActorEndpointClient | `ActorEndpointClient`}
   * @param actionStreamClient - A grpc-web client for the {@link ActorEndpoint#ActionStream} endpoint
   */
  // eslint-disable-next-line max-params
  constructor(
    private cogSettings: CogSettings,
    private actors: [
      TrialActor,
      ActorImplementation<Message, Message, Message, Message>,
    ][],
    private trialLifecycleClient: TrialLifecycleClient,
    private actorEndpointClient: ActorEndpointClient,
    private actionStreamClient: grpc.Client<
      TrialActionRequest,
      TrialActionReply
    >,
  ) {}

  /**
   * A list of {@link TrialActor}s associated to this trial.
   * @returns The trial actors for this trial.
   */
  public getActiveActors(): TrialActor[] {
    return this.actors.map(([trialActor]) => trialActor);
  }

  public getTickId(): number {
    throw new Error('getTickId() is not implemented');
  }

  public getTriaId(): string {
    if (!this.trialId) {
      throw new Error('No trial currently running');
    }
    return this.trialId;
  }

  public async getTrialInfo(trialId: string): Promise<TrialInfoReply> {
    // eslint-disable-next-line compat/compat
    return await new Promise((resolve, reject) => {
      this.trialLifecycleClient.getTrialInfo(
        new TrialInfoRequest(),
        new grpc.Metadata({'trial-id': trialId}),
        (error, response) => {
          if (error || response === null) {
            return reject(error);
          }
          resolve(response);
        },
      );
    });
  }

  public isTrialOver(): boolean {
    throw new Error('isTrialOver() is not implemented');
  }

  public async joinTrial(
    trialId: string,
    trialActor?: TrialActor,
  ): Promise<JoinTrialReturnType> {
    const request = new TrialJoinRequest();
    request.setTrialId(trialId);
    if (trialActor) {
      request.setActorName(trialActor.name);
      request.setActorClass(trialActor.class);
    }
    // eslint-disable-next-line compat/compat
    const response = await new Promise<JoinTrialReturnType>(
      (resolve, reject) => {
        this.actorEndpointClient.joinTrial(
          request,
          (error: ServiceError | null, response: TrialJoinReply | null) => {
            if (error || !response) {
              return reject(error);
            }
            resolve(response.toObject());
          },
        );
      },
    );

    await this.startActors(response.trialId);
    return response;
  }

  // TODO: WIP - See https://gitlab.com/ai-r/cogment-js-sdk/-/issues/20
  // eslint-disable-next-line max-params
  public async sendMessage(
    receiverName: string,
    senderName: string,
    messagePayload: AnyPb,
  ): Promise<SendMessageReturnType> {
    const request = new TrialMessageRequest();
    const message = new CogMessage();
    message.setSenderName(senderName);
    message.setReceiverName(receiverName);
    message.setPayload(messagePayload);
    request.addMessages(message);
    // eslint-disable-next-line compat/compat
    return new Promise<SendMessageReturnType>((resolve, reject) => {
      this.actorEndpointClient.sendMessage(request, (error, response) => {
        if (error || response === null) {
          return reject(error);
        }
        resolve(response.toObject());
      });
    });
  }

  public async startTrial(
    userId: string,
    trialConfig?: Message,
  ): Promise<StartTrialReturnType> {
    // eslint-disable-next-line compat/compat
    return new Promise<StartTrialReturnType>((resolve, reject) => {
      const request = new TrialStartRequest();
      if (userId) {
        request.setUserId(userId);
      }
      if (trialConfig && this.cogSettings.trial.config_type) {
        const trialConfig = new TrialConfig();
        trialConfig.setContent(trialConfig.serializeBinary());
        request.setConfig(trialConfig);
      } else if (trialConfig) {
        // TODO: should we throw here?
        logger.warn(
          'trialConfig passed without a configured TrialConfig protobuf. Please update cogment.yaml and run cogment generate',
        );
      }
      this.trialLifecycleClient.startTrial(request, (error, response) => {
        if (error || response === null) {
          return reject(error);
        }
        this.trialId = response.getTrialId();
        resolve(response.toObject());
      });
    });
  }

  public async terminateTrial(trialId: string): Promise<void> {
    // eslint-disable-next-line compat/compat
    return await new Promise((resolve, reject) => {
      this.trialLifecycleClient.terminateTrial(
        new TerminateTrialRequest(),
        new grpc.Metadata({'trial-id': trialId}),
        (error, response) => {
          if (error || response === null) {
            return reject(error);
          }
          this.trialId = undefined;
          resolve();
        },
      );
    });
  }

  public async version(): Promise<VersionReturnType> {
    // eslint-disable-next-line compat/compat
    return await new Promise((resolve, reject) => {
      this.trialLifecycleClient.version(
        new VersionRequest(),
        (error, response) => {
          if (error || response === null) {
            return reject(error);
          }
          resolve({version: response.toObject().versionsList});
        },
      );
    });
  }

  private async startActors(trialId: string) {
    // eslint-disable-next-line compat/compat
    return Promise.all(
      this.actors.map(([actor, actorImpl]) => {
        logger.info(`Starting actor ${actor.name}`);
        this.actionStreamClient.start({
          'trial-id': trialId,
          'actor-name': actor.name,
        });

        const actorSession = new ActorSession(
          actor,
          this.cogSettings,
          this.actorEndpointClient,
          this.actionStreamClient,
        );
        return actorImpl(actorSession);
      }),
    );
  }
}

export type SendMessageReturnType = TrialMessageReply.AsObject;
export type StartTrialReturnType = TrialStartReply.AsObject;

export type JoinTrialArguments = {
  actorClass?: string;
  actorName?: string;
  trialId: string;
};

export type JoinTrialReturnType = TrialJoinReply.AsObject;

export type VersionReturnType = {version: VersionInfo.AsObject['versionsList']};
