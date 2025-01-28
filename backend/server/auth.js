import { webcrypto, createHash, createHmac, randomUUID } from "node:crypto"
import { sendBadRequest, sendUnauthorized } from "./linkit.js"
import { config } from "dotenv"
import { validateService } from "./dynamo.js"
config()

const TOKEN_SECRET = process.env.TOKEN_SECRET
const TOKEN_PAYLOAD_OFFSET = 1724082267615

// console.log("token: "+TOKEN_SECRET)

/**
 * 
 * @param {*} token 
 * @returns {header: any | {}} When valid - a non empty object
 */
// export const validateChatToken = (token)=>{
//     let { header, payload} = decodeToken(token)
    
//     if(!header || !payload){
//         console.log("No header / payload")
//         return {}
//     }
//     try{
//         let decoded = JSON.parse(header)
//         if(Date.now() > new Date(decoded.expires).getTime()){
//             console.log("Expired!")
//             throw new Error("LOL!")
//         }
//     }catch{
//         console.log("Cant decode!")
//         return {}
//     }
//     let recreatedToken = createToken({header, payload})
//     if(recreatedToken !== token || !recreatedToken || !token){
//         console.log("Match failed")
//         return {}
//     }
//     console.log("Payload: "+payload+", header: "+header)
//     try{
//         return JSON.parse(header)
//     }catch{}
// }

const keys = {};

/**
 * @deprecated
 */
export const loadKeys = ()=>{
    keys[hashToken(process.env.SAR_EL_KEY)] = "sar_el_tours"
    keys[hashToken(process.env.NEVEL_KEY)] = "nevel_david"
    // console.log(JSON.stringify(keys))
}

const getHostByKey = (key)=>{
    return keys[key]
}

const isString = (obj) => typeof obj === 'string';

/**
 * @deprecated Was previously used to valid against locally stored secrets
 * @param {*} key 
 * @see handleAccessForToken
 * @returns 
 */
const validateRefreshKey = (key)=>{
    if(!isString(key)){
        return;
    }

    try{
        let hashed = hashToken(key)
        // console.log("New hashed: "+hashed)
        let host
        //TODO: change hashed to 
        if(hashed && (host = getHostByKey(hashed))){
            return host
        }
        return;
    }catch{
        return;
    }
}


/**
 * @param {string | undefined} obj 
 * @returns {boolean}
 */
const isTimeIdValid = (obj)=>{
    if(!isString(obj)){
        return false
    }
    return obj.match(/^[a-zA-Z0-9]+$/) !== null
}

/**
 * @param {string | undefined} obj 
 * @returns {boolean}
 */
const isSecretValid = (obj)=>{
    if(!isString(obj)){
        return false
    }
    return obj.match(/^[a-zA-Z0-9\_\-]+$/) !== null
}

/**
 * Generates a JWT like token (lasts 30 mins) - a token that'd be used for authorization from frontend
 * @param {{res: Response, id: string, secret: string}} param0 
 * @returns 
 */
export const handleAccessForToken = async ({ res, id, secret }) => {
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
 * @deprecated this method was replaces by hanndleAccessForToken which works with database
 * @param {*} param0 
 * @see handleAccessForToken
 * @returns 
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

const generateToken = ({ header }) => {
    // if (!isValidId(userId)) return undefined;
    let token = createToken({ header, payload: `${tokenExpireFromNow() - TOKEN_PAYLOAD_OFFSET}`, noPadding: true })
    return token
}

const tokenExpireFromNow = ()=>{
    return Date.now() + 30 * 60 * 1000 //30 minutes
}

/**
 * Validates the JWT like token 
 * @param {*} param0 
 * @returns information saved on token | empty object if it's invalid
 * @see validateToken which it depends on
 */
export const validateChatToken = ({token})=>{
    try {
        let result = validateToken({token, noPadding: true})
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
 * @param {{token: string}} param0 
 * @returns {string|undefined} When the token is valid user id is returned
 */
const validateToken = ({ token, noPadding }) => {
    if (!isString(token)) return undefined;

    let [header, payload] = token.split(".")
    let recreatedToken = createToken({ header, payload, encoded: true, noPadding })
    // console.log("COMPARE:\n\t\x1b[32;m"+token+"\x1b[0;m\n\t"+recreatedToken)
    if (token !== recreatedToken || !recreatedToken) {
        return undefined
    }
    try {
        header = decodeBase64(header)
        payload = Number(decodeBase64)
        if(payload + TOKEN_PAYLOAD_OFFSET >= Date.now()){
            // console.log("\x1b[32;mExpired\x1b[0;m")
            return undefined
        }
    }catch(e){
        console.error(e)
        return undefined
    }
    return header
}

/**
 * Create a JWT like token that lasts 30 mins 
 * @param {{header: string, payload: string, encoded: boolean, noPadding: boolean}} param0 encoded - whether the header & payload are already base64 
 * @returns 
 */
export const createToken = ({ header, payload, encoded, noPadding }) => {
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

export const hashToken = (token) => {
    return createHash("sha256").update(token).digest('base64').replace(/\//g, "_").replace(/\+/g, "-")
}

export const decodeToken = (token)=>{
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

const hmac = (data, secret) => {
    return createHmac("sha256", secret).update(data).digest("base64url")
}

const encodeBase64 = (str, noPadding) => {
    if (!isString(str)) return undefined;
    let encoded = btoa(str)
    // return encodeURIComponent(encoded)
    return noPadding ? encoded.replace(/=/g, "").replace(/\//g, '_').replace(/\+/, '-') : encoded
}

const decodeBase64 = (data) => {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"))
}
