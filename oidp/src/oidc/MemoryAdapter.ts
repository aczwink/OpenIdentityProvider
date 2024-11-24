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

export class MemoryAdapter implements Adapter
{
    constructor()
    {
        this.storage = {};
    }

    //Public methods
    public async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void | undefined>
    {
        this.storage[id] = payload;
    }
    
    public async find(id: string): Promise<void | AdapterPayload | undefined>
    {
        return this.storage[id];
    }

    findByUserCode(userCode: string): Promise<void | AdapterPayload | undefined> {
        console.log("MemoryAdapter.findByUserCode");
        throw new Error("Method not implemented.");
    }

    public async findByUid(uid: string): Promise<void | AdapterPayload | undefined>
    {
        for (const id in this.storage)
        {
            if (Object.prototype.hasOwnProperty.call(this.storage, id))
            {
                const session = this.storage[id];
                if(session?.uid === uid)
                    return session;
            }
        }
        return undefined;
    }
    
    public async consume(id: string): Promise<void | undefined>
    {
        this.storage[id]!.consumed = Math.floor(Date.now() / 1000);
    }

    public async destroy(id: string): Promise<void | undefined>
    {
        delete this.storage[id];
    }

    public async revokeByGrantId(grantId: string): Promise<void | undefined>
    {
        for (const key in this.storage)
        {
            if (Object.prototype.hasOwnProperty.call(this.storage, key))
            {
                const value = this.storage[key];
                if(value?.grantId === grantId)
                {
                    delete this.storage[key];
                }
            }
        }
    }

    //State
    private storage: Dictionary<AdapterPayload>;
}