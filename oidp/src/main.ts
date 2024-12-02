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
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import "acts-util-core";
import { interactionsRouter } from "./oidc/interactions";
import { Factory, GlobalInjector, HTTP } from "acts-util-node";
import { allowedOrigins, port } from "./config";
import { OIDCProviderService } from "./oidc/OIDCProviderService";
import { OpenAPI } from 'acts-util-core';
import { APIRegistry } from 'acts-util-apilib';
import { ActiveDirectoryService } from "./services/ActiveDirectoryService";
import { UsersManager } from "./services/UsersManager";
import { PKIManager } from "./services/PKIManager";

async function BootstrapServer()
{
    GlobalInjector.Resolve(ActiveDirectoryService).Initialize(); //start samba AD early

    const requestHandlerChain = Factory.CreateRequestHandlerChain();
    requestHandlerChain.AddCORSHandler(allowedOrigins);
    requestHandlerChain.AddBodyParser();

    const pki = GlobalInjector.Resolve(PKIManager);

    requestHandlerChain.AddRequestHandler(
        new HTTP.JWTVerifier(
            await pki.LoadSigningKeys(),
            "http://localhost:3000", //TODO WHY HTTP AND NOT HTTPS?
            false
        )
    );

    await import("./__http_registry");

    const openAPIDef: OpenAPI.Root = (await import("../dist/openapi.json", { assert: { type: "json" }, })).default as any;
    const backendStructure: any = (await import("../dist/openapi-structure.json", { assert: { type: "json" }, })).default;
    requestHandlerChain.AddRequestHandler(new HTTP.RouterRequestHandler(openAPIDef, backendStructure, APIRegistry.endPointTargets, false));

    const app = requestHandlerChain.requestListener as express.Express;

    const ejs = (await import("ejs")).default as any;
    app.set('view engine', 'ejs');
    app.engine('ejs', ejs.__express);
    app.set('views', path.join(__dirname, './views'));

    requestHandlerChain.AddThirdPartyHandler(interactionsRouter);
    requestHandlerChain.AddThirdPartyHandler(GlobalInjector.Resolve(OIDCProviderService).provider.callback());

    const keyPair = await pki.LoadServiceKeyPair();
    const server = https.createServer({
        key: keyPair.privateKey,
        cert: keyPair.publicKey
    }, requestHandlerChain.requestListener);

    server.listen(port, () => {
        console.log('oidc-provider listening on port ' + port + ', check https://localhost:' + port + '/.well-known/openid-configuration');
    });

    process.on('SIGINT', function()
    {
        console.log("Shutting server down...");
        server.close();
    });
}

const command = process.argv[2];
if(command !== undefined)
    ExecMgmtCommand(command, process.argv.slice(3));
else
    BootstrapServer();

async function ExecMgmtCommand(command: string, args: string[])
{
    switch(command)
    {
        case "create-user":
        {
            if(args.length !== 2)
            {
                console.error("You need to provide exactly two arguments on the command line, e-mail address and password");
                return;
            }

            const eMailAddress = args[0];
            const password = args[1];

            const usersManager = GlobalInjector.Resolve(UsersManager);
            const userId = await usersManager.CreateUser({
                type: "human",
                eMailAddress,
                givenName: eMailAddress
            });
            const error = await usersManager.SetPassword(userId, password);
            if(error)
                console.log("Error while setting users password: ", error);
            else
                console.log("User", eMailAddress, "was created successfully.");
        }
        break;
        default:
            console.error("Unknown management command: " + command);
    }
}
