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

import {NodeHttpTransport} from '@improbable-eng/grpc-web-node-http-transport';
import {createService} from '../../src';
import {TrialStartRequest} from '../../src/cogment/api/orchestrator_pb';

import cogSettings from './cogment-app/clients/web/src/cog_settings';
import {
  AsyncMessage,
  EmmaAction,
  Observation,
  Reward,
} from './cogment-app/clients/web/src/data_pb';

describe('a cogment-app', () => {
  test.skip('runs', async () => {
    const COGMENT_URL = 'http://grpcwebproxy:8080';

    const service = createService(cogSettings);

    const transport = NodeHttpTransport();
    const trialLifecycleClient = service.createTrialLifecycleClient(
      COGMENT_URL,
      transport,
    );
    const trialController = service.createTrialController(trialLifecycleClient);

    service.registerActor<EmmaAction, Observation, Reward, AsyncMessage>(
      {name: 'emma', class: 'player'},

      async (actorSession) => {
        actorSession.start();

        for await (const {
          observation,
          message,
          reward,
        } of actorSession.eventLoop()) {
          if (observation != null) {
            const move = await Promise.resolve();
            actorSession.doAction(new EmmaAction());
          }
          if (message != null) {
          }

          if (reward != null) {
          }
        }
      },
    );
    return trialController
      .startTrial(new TrialStartRequest())
      .then((response) => {
        console.log(response);
      });
  });
});

// /const grpcWebServer = transport({
//  MethodDefinition: (req: any) => {},
//  Debug: true,
//  OnChunk(chunkBytes: Uint8Array, flush: boolean | undefined): void {},
//  OnEnd(err: Error | undefined): void {},
//  OnHeaders(headers: Metadata, status: number): void {},
//  Url: '/_socket',
// });
