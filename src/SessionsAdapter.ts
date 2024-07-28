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
import { Dictionary } from "acts-util-core";
import { Adapter, AdapterPayload } from "oidc-provider";

export class SessionsAdapter implements Adapter
{
    constructor()
    {
        this.sessions = {};
    }

    public async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void | undefined>
    {
        this.sessions[id] = payload;
    }

    public async find(id: string): Promise<void | AdapterPayload | undefined>
    {
        return this.sessions[id];
    }

    findByUserCode(userCode: string): Promise<void | AdapterPayload | undefined>
    {
        console.log("findByUserCode", arguments);
        throw new Error("Method not implemented.");
    }

    public async findByUid(uid: string): Promise<void | AdapterPayload | undefined>
    {
        console.log("findByUid", arguments, "sessions");
        for (const sessionId in this.sessions)
        {
            if (Object.prototype.hasOwnProperty.call(this.sessions, sessionId))
            {
                const session = this.sessions[sessionId];
                console.log("findByUid found", arguments, "sessions", session);
                return session;
            }
        }
        return undefined;
    }

    consume(id: string): Promise<void | undefined>
    {
        console.log("consume", arguments);
        throw new Error("Method not implemented.");
    }

    public async destroy(id: string): Promise<void | undefined>
    {
        delete this.sessions[id];
    }

    revokeByGrantId(grantId: string): Promise<void | undefined>
    {
        console.log("revokeByGrantId", arguments);
        throw new Error("Method not implemented.");
    }

    //Private state
    private sessions: Dictionary<AdapterPayload>;
}