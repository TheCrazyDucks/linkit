import { webcrypto, createHash, createHmac, randomUUID } from "node:crypto"
import { sendBadRequest, sendUnauthorized } from "./linkit.js"
import { config } from "dotenv"
import { validateService } from "./dynamo.js"
config()

const TOKEN_SECRET = process.env.TOKEN_SECRET
const TOKEN_PAYLOAD_OFFSET = 1724082267615

const keys: Record<string, any> = {};

/**
 * @deprecated
 */
export const loadKeys = ()=>{
    keys[hashToken(process.env.SAR_EL_KEY)] = "sar_el_tours"
    keys[hashToken(process.env.NEVEL_KEY)] = "nevel_david"
}

const getHostByKey = (key: string): Record<string, any>=>{
    return keys[key]
}

const isString = (obj: any) => typeof obj === 'string';

/**
 * @deprecated Was previously used to valid against locally stored secrets
 * @see handleAccessForToken
 */
const validateRefreshKey = (key: string | null | undefined): (undefined | string)=>{
    if(!isString(key)){
        return;
    }

    try{
        let hashed = hashToken(key)
        //TODO: change hashed to 
        let host: any;
        if(hashed && (host = getHostByKey(hashed))){
            return host
        }
        return;
    }catch{
        return;
    }
}


const isTimeIdValid = (obj: any): boolean=>{
    if(!isString(obj)){
        return false
    }
    return obj.match(/^[a-zA-Z0-9]+$/) !== null
}


const isSecretValid = (obj: string): boolean=>{
    if(!isString(obj)){
        return false
    }
    return obj.match(/^[a-zA-Z0-9\_\-]+$/) !== null
}

/**
 * Generates a JWT like token (lasts 30 mins) - a token that'd be used for authorization from frontend
 * @returns {never}
 */
export const handleAccessForToken = async ({ res, id, secret }: {res: any, id: string, secret: string}) => {
    if(!isTimeIdValid(id) || !isSecretValid(secret)){
        sendBadRequest(res)
        return;
    }

    let host = await validateService({access_id: id, access_key: secret, type: "Linkit"})
    if(!host){
        sendUnauthorized(res)
        return;
    }

    let token = generateToken({header: JSON.stringify({host})})
    // console.log("\x1b[33;0m"+token+"\x1b[0;m")
    if(token){
        res.status(200).send(JSON.stringify({token}))
        return;
    }
    res.status(500).end() 
}

/**
 * @deprecated this method was replaces by handleAccessForToken which works with database
 * @see handleAccessForToken
 */
export const handleTokenExchange = ({res, key})=>{
    let host = validateRefreshKey(key)
    if(!host){
        //No exchange can ocurr
        sendUnauthorized(res)
        return;
    }
    // console.log(host)
    let token = generateToken({header: JSON.stringify({host})})
    // console.log("\x1b[33;0m"+token+"\x1b[0;m")
    if(token){
        res.status(200).send(JSON.stringify({token}))
        return;
    }
    res.status(500).end()
}

export const generateToken = ({ header }) => {
    let token = createToken({ header, payload: `${tokenExpireFromNow() - TOKEN_PAYLOAD_OFFSET}`, noPadding: true })
    return token
}

/**
 * @returns {number} 30 minutes from now
 */
const tokenExpireFromNow = (): number =>{
    return Date.now() + 30 * 60 * 1000 //30 minutes
}

/**
 * Validates the "JWT"-like token 
 * @returns Information saved on token | empty object if it's invalid
 * @see validateToken which it depends on
 */
export const validateChatToken = ({token}:{token: string}):(Record<string, any> | {}) =>{
    try {
        let result = validateToken(token, true)
        if(result){
            return JSON.parse(result)
        }
        return {}
    }catch {
        return {}
    }

}

/**
 * This function breaks the token & rebuilts it to ensure it's valid
 * @returns When the token is valid user id is returned
 */
export const validateToken = ( token: string, noPadding: boolean): string | undefined => {
    if (!isString(token)) return undefined;

    let [header, payload] = token.split(".")
    let recreatedToken = createToken({ header, payload, encoded: true, noPadding })
    // console.log("COMPARE:\n\t\x1b[32;m"+token+"\x1b[0;m\n\t"+recreatedToken)
    if (token !== recreatedToken || !recreatedToken) {
        return undefined
    }
    try {
        header = decodeBase64(header)
        let time = Number(decodeBase64(payload)) || 0

        // console.log(`Expires in ${(time + TOKEN_PAYLOAD_OFFSET - Date.now()) / 1000}s`)

        //If now is greater than token's time - it's expired
        if(time + TOKEN_PAYLOAD_OFFSET <= Date.now()){
            //Expired
            return undefined
        }
    }catch(e){
        console.error(e)
        //Couldn't decode
        return undefined
    }
    return header
}

type createTokenParams = {
    header: String, payload: String, encoded?: boolean, noPadding: boolean
}

/**
 * Create a JWT like token that lasts 30 mins 
 * @param encoded - whether the header & payload are already base64 
 * @returns 
 */
export const createToken = ({ header, payload, encoded, noPadding}:createTokenParams): undefined | string => {
    if (!isString(header) || !isString(payload)) return undefined;

    let h = header
    let p = payload
    if (!encoded) {
        try {
            h = encodeBase64(header, noPadding)
            p = encodeBase64(payload, noPadding)
            // console.log(`h,p: ${h},${p}`)
        }
        catch {
            // console.log("createToken::unable to encode base 64")
            return undefined
        }
    }

    return `${h}.${p}.${hmac((h + "." + p).toString(), TOKEN_SECRET)}`
}

export const hashToken = (token: string): string => {
    return createHash("sha256").update(token).digest('base64').replace(/\//g, "_").replace(/\+/g, "-")
}

export const decodeToken = (token: string): ({header: string, payload: string} | {})=> {
    if(!isString(token)) return {};
    let [header, payload] = token.split(".")

    try{
        return {
            header: decodeBase64(header),
            payload: decodeBase64(payload)
        }
    }catch{
        return {}
    }
}

const hmac = (data: string, secret: string) => {
    return createHmac("sha256", secret).update(data).digest("base64url")
}

const encodeBase64 = (str: string, noPadding: boolean): string | undefined => {
    if (!isString(str)) return undefined;
    let encoded = btoa(str)
    // return encodeURIComponent(encoded)
    return noPadding ? encoded.replace(/=/g, "").replace(/\//g, '_').replace(/\+/, '-') : encoded
}

const decodeBase64 = (data: string) => {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"))
}
