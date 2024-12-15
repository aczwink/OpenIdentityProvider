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

export default {
    AUTH_ENDPOINT: process.env.OIDP_AUTH_ENDPOINT!,
    BACKEND: process.env.OIDP_BACKEND!,
    BACKEND_PORT: process.env.OIDP_BACKEND_PORT!,
    ENDSESSION_ENDPOINT: process.env.OIDP_ENDSESSION_ENDPOINT!,
    FRONTEND_BASEURL: process.env.OIDP_FRONTEND_BASEURL!,
    TOKEN_ENDPOINT: process.env.OIDP_TOKEN_ENDPOINT!,
};