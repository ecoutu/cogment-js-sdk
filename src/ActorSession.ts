/*
 *  Copyright 2020 Artificial Intelligence Redefined <dev+cogment@ai-r.com>
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

import {ActorSession, Event, Reward, TrialActor} from './types/cogment';

export class ActorSessionImpl<ActionT, ObservationT, RewardT, MessageT>
  implements ActorSession<ActionT, ObservationT, RewardT, MessageT> {
  public addFeedback(to: string[], reward: Reward<RewardT>): void {}

  public doAction(action: ActionT): void {}

  public eventLoop(): AsyncIterator<Event<ObservationT, RewardT, MessageT>> {}

  public getActiveActors(): TrialActor[] {}

  public getTickId(): number {}

  public getTriaId(): string {}

  public isTrialOver(): boolean {}

  public sendMessage(to: string[], message: MessageT): void {}

  public start(): void {}
}
