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
import https from "https";
import path from "path";
import "acts-util-core";
import { interactionsRouter } from "./oidc/interactions";
import { Factory, GlobalInjector, HTTP } from "acts-util-node";
import { CONFIG_OIDC } from "./env";
import { OIDCProviderService } from "./oidc/OIDCProviderService";
import { OpenAPI } from 'acts-util-core';
import { APIRegistry } from 'acts-util-apilib';
import { ActiveDirectoryService } from "./services/ActiveDirectoryService";
import { UsersManager } from "./services/UsersManager";
import { PKIManager } from "./services/PKIManager";
import { PasswordValidationService } from "./services/PasswordValidationService";
import { UserGroupsManager } from "./services/UserGroupsManager";
import { AppRegistrationsController } from "./data-access/AppRegistrationsController";
import { ClaimsController } from "./data-access/ClaimsController";
import { SCOPE_ADMIN } from "./api_security";

async function BootstrapServer()
{
    GlobalInjector.Resolve(ActiveDirectoryService).Initialize(); //start samba AD early

    const requestHandlerChain = Factory.CreateRequestHandlerChain();
    requestHandlerChain.AddCORSHandler(CONFIG_OIDC.allowedOrigins);
    requestHandlerChain.AddBodyParser();

    const pki = GlobalInjector.Resolve(PKIManager);

    requestHandlerChain.AddRequestHandler(
        new HTTP.JWTVerifier(
            await pki.LoadSigningKeys(),
            "https://" + CONFIG_OIDC.domain + ":" + CONFIG_OIDC.port,
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

    const port = CONFIG_OIDC.port;
    server.listen(port, () => {
        console.log('oidc-provider listening on port ' + port + ', check https://' + CONFIG_OIDC.domain + ':' + port + '/.well-known/openid-configuration');
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
        case "bootstrap":
        {
            if(args.length !== 2)
            {
                console.error("You need to provide exactly two arguments on the command line, e-mail address and password");
                return;
            }

            const eMailAddress = args[0];
            const password = args[1];

            const passwordValidationService = GlobalInjector.Resolve(PasswordValidationService);
            const result = passwordValidationService.Validate(password);
            if(result !== undefined)
            {
                console.log("Password not valid: " + result)
                return;
            }

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

            const userGroupsManager = GlobalInjector.Resolve(UserGroupsManager);
            const groupId = await userGroupsManager.Create({ name: "Admins" });
            await userGroupsManager.AddMember(groupId, userId);

            const appRegistrationsController = GlobalInjector.Resolve(AppRegistrationsController);
            const appRegId = await appRegistrationsController.Create("OIDP_PORTAL", {
                appUserId: null,
                displayName: "OpenIdentityProvider Portal",
                postLogoutRedirectURIs: ["http://localhost:8081/oauth2loggedout"],
                redirectURIs: ["http://localhost:8081/oauth2loggedin"],
                type: "authorization_code",
            });

            const claimsController = GlobalInjector.Resolve(ClaimsController);
            const claimId = await claimsController.AddVariable(appRegId, {
                claimName: "scope",
                claimType: "string-list-space-separated"
            });
            await claimsController.AddValue(claimId, { groupId, value: "openid" });
            await claimsController.AddValue(claimId, { groupId, value: "email" });
            await claimsController.AddValue(claimId, { groupId, value: "profile" });
            await claimsController.AddValue(claimId, { groupId, value: SCOPE_ADMIN });

            console.log("Initial configuration complete :)");
        }
        break;
        default:
            console.error("Unknown management command: " + command);
    }
}
