import { StringForNextToken } from "aws-sdk/clients/s3control"

export type Host = {
    id: string
    name: string
    vectorId: string //Vector collection index (In our case chroma)
    access_key: string
    options: [string]
    settings: [string]
}

export type User = {
    id: string
    name: string
    mail: string
    pw: string
    services: string
}

type Service = {
    id: string //Will be used for vector database...
    user_id?: string
    access_key: string
    access_id: string
    start_date: number | any,
    end_date?: number | any, //TODO: rethink about dates...
    status: ServiceStatus,
    type: ServiceType,
    tier: any,
    prefrences?: ServicePrefrences
}

type Usage = {
    // service_id: string,
    user_id: string,
    service_id: string,
    month_id: MonthId,
    start_date: number,
    calls: number,
    end_date: string | undefined,
}

type year = number;
type month = number//'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec'

// type ABC = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'm' | 'l' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'x' | 'y' | 'z'

type MonthId = `${year}-${month}`;

export type ServicePrefrences = {
    instruction: string,
    tools: Array<string>,
    qa?: Record<string, string>
}

declare const ServiceStatus: {
    readonly PAUSED: "Paused",
    readonly ACTIVE: "Active",
    readonly DELETED: "Deleted",
    readonly PENDING: "Pending",
}

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

declare const ServiceType: {
    readonly LINKIT: "Linkit"
}
type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

// const Hosts: Array<Host> = [
//     {
//         id: "xBDh230",
//         access_key: "ahsbdhavfals@helb",
//         name: "Sar El Tours",
//         vectorId: "sar_el_tours",
//         settings: [""],
//         options: ["{\"q\": \"who are you?\", \"a\": \"donald duck!\"}"]
//     }
// ]

//Need to get host vectorId for access key...

// const Users = [
//     {
//         id: "21uheib21e",
//         name: "Sar El Tours",
//         mail: "mail@sareltours.com",
//         pw: "absdhasubDBHYI@#UHE!(PEH12121",
//         hosts_ids: "xBDh230;v9900"
//     }
// ]