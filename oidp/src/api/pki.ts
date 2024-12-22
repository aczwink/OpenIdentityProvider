/**
 * OpenIdentityProvider
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
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

import { APIController, BodyProp, Get, NotFound, Path, Post, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME } from "../api_security";
import { PKI_Type, PKIController } from "../data-access/PKIController";
import { PKIManager } from "../services/PKIManager";

@APIController("pki")
@Security(OIDC_API_SCHEME, [])
class _api_
{
    constructor(private pkiController: PKIController, private pkiManager: PKIManager)
    {
    }

    @Post()
    public async CreateServerCertificate(
        @BodyProp commonName: string
    )
    {
        await this.pkiManager.CreateServerCert(commonName);
    }

    @Get()
    public async RequestServerCertificates()
    {
        return this.pkiController.QueryByType(PKI_Type.Server);
    }

    @Get("{name}")
    public async DownloadServerCert(
        @Path name: string
    )
    {
        const keyPair = await this.pkiManager.ReadKeyPair(name);
        if(keyPair === undefined)
            return NotFound("certificate does not exist");
        return keyPair;
    }
}