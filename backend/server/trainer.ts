import type {Response} from "express"

function handleTrainByEndpoint({res}:{res: Response}){
    res.send() 
}

export const trainer = {
    handleTrainByEndpoint
}