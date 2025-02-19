async function test() {
    console.log(process.argv[2])
    try {
        let lol = await fetch("http://127.0.0.1:8000/linkit/token", {
            body: JSON.stringify({
                key: "lol",
                secret: process.argv[2]
            }),
            method: "post",
            headers: {
                "Content-Type": "application/json"
            }
        })
        console.log(await lol.text())
        // console.log(await lol.json())
    } catch (e) {
        // console.error(e)
    }

}

async function run() {
    for (let i = 0; i < 1001; i++) {
        // setTimeout(() => {
            test()
        // }, i * 10);
    }
}

// for(let j = 0; j < 1000; j++){
run()
// }

let terminated = false

process.on('SIGINT', () => {
    console.log("dammmm")
})
