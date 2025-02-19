import {createToken, validateToken, generateToken} from "./auth"
import {test, expect, describe} from "bun:test"

const TOKEN_PAYLOAD_OFFSET = 1724082267615

test("Chat validation", ()=>{
    let header = JSON.stringify({lol: "lol"});
    let goodToken = createToken({header, payload: (Date.now() + 1000 * 60 - TOKEN_PAYLOAD_OFFSET).toString(), noPadding: true})
    let badToken = createToken({header, payload: (Date.now() - TOKEN_PAYLOAD_OFFSET ).toString(), noPadding: true})
    expect(validateToken(goodToken, true)).toBe(header)
    expect(validateToken(badToken, true)).toBe(undefined)
    expect(validateToken(generateToken({header}), true)).toBe(header)
})

test("", ()=>{

})