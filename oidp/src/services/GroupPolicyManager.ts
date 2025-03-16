/**
 * OpenIdentityProvider
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */
import fs from "fs";
import { Injectable } from "acts-util-node";
import { ActiveDirectoryService } from "./ActiveDirectoryService";
import { PKIManager } from "./PKIManager";

const caGPOName = "OIDP:DistributeCA";

@Injectable
export class GroupPolicyManager
{
    constructor(private activeDirectoryService: ActiveDirectoryService, private pkiManager: PKIManager)
    {
    }

    //Public methods
    public async EnsurePoliciesAreSetup()
    {
        const gpos = await this.activeDirectoryService.ListGPOs();
        const caGPO = gpos.find(x => x.displayName === caGPOName);
        if(caGPO === undefined)
            await this.SetupCAGPO();
    }

    //Private methods
    private async GenerateCAScript()
    {
        const cert = await this.pkiManager.LoadCACert();
        return `
. /etc/os-release

if [ $NAME="Ubuntu" ]
then
    echo "${cert}" > /usr/local/share/ca-certificates/oidp-devad.home.arpa.crt
    update-ca-certificates
else
    echo "Unknown distro :S"
    exit 1
fi`;
    }

    private async SetupCAGPO()
    {
        const script = await this.GenerateCAScript();
        const scriptPath = "/srv/distribute_ca.sh";
        await fs.promises.writeFile(scriptPath, script, "utf-8");

        await this.activeDirectoryService.InstallSambaGPOs();

        const gpoId = await this.activeDirectoryService.CreateGPO(caGPOName);
        await this.activeDirectoryService.AddStartupScriptPolicyToGPO(gpoId, scriptPath);
        await this.activeDirectoryService.LinkGPOToDomain(gpoId);
    }
}