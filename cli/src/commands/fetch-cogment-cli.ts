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

import { Command, flags } from '@oclif/command';
import { https } from 'follow-redirects';
import { cosmiconfig } from 'cosmiconfig';
import { CosmiconfigResult } from 'cosmiconfig/dist/types';
import fs from 'fs';
import process from 'process';

const moduleName = 'cogment-cli';

interface CogmentApiConfig {
    releaseUrl: string;
}

const osMap : {[index:string] : string} = {
    darwin: "macOS",
    linux: "linux",
    win32: "windows"
} 

export default class FetchProtos extends Command {
    static description = 'fetch fetch-cogment-cli release';

    static examples = [`$ cogjs-cli fetch-cogment-cli`];

    static flags = {
        help: flags.help({ char: 'h' }),
        releaseUrl: flags.string({
            char: 'r',
            description: 'cogment-cli release version, uses cosmiconfig',
        }),
    };

    static args = [];

    async run(): Promise<void> {
        const { flags } = this.parse(FetchProtos);
        const fileName = 'cogment/cli/cogment';

        const result: CosmiconfigResult = await cosmiconfig(moduleName).search();

        if (!result || !result.config) {
            this.error('No configuration provided', { exit: 1 });
        }
        const config: CogmentApiConfig = result.config as CogmentApiConfig;
        const urlPreParse = flags.releaseUrl ?? config.releaseUrl;

        const os = osMap[process.platform.toString()]
        const url = urlPreParse.replace("${OS}", os);

        this.log(`Fetching cogment-cli from ${url}`);

        try {
            const file = fs.createWriteStream(fileName);
            https.get(url, function(response) {
                response.pipe(file);
            });
        } catch (error) {
            this.error(
                `Failed to fetch cogment-cli: ${(error as Error).stack ?? ''}`,
                {
                    exit: 1,
                },
            );
        }

        this.log('Download successful');
        this.log('Making file executable...');
        fs.chmodSync('./cogment/cli/cogment', '755');
        this.log('Done!')
    }
}