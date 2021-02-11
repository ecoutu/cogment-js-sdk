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

import {createService} from '../src/cogment';
import {CogmentService} from '../src/cogment/CogmentService';
import {config} from '../src/cogment/lib/Config';
import cogSettings from './end-to-end/cogment-app/webapp/src/cog_settings';

describe('Cogment', () => {
  describe('createService', () => {
    test('returns a `CogmentService`', () => {
      const service = createService({
        cogSettings,
        grpcURL: config.connection.http,
      });
      expect(service).toBeInstanceOf(CogmentService);
    });
  });
});
