import { SecretNetworkClient, Wallet} from "secretjs"
import * as fs from "fs"
import dotenv from "dotenv"
dotenv.config()

const wallet = new Wallet(process.env.MNEMONIC)

const contract_wasm = fs.readFileSync("../contract.wasm.gz")

// 1. Connected to the Secret Network Client
const secretjs = new SecretNetworkClient({
    chainId: "pulsar-3",
    url: "https://api.pulsar.scrttestnet.com",
    wallet: wallet,
    walletAddress: wallet.address,
})
// console.log(secretjs)

// 2. Upload a compiled contract to Secret Network with secret.js
let upload_contract = async () => {
    let tx = await secretjs.tx.compute.storeCode(
        {
            sender: wallet.address,
            wasm_byte_code: contract_wasm,
            source: "",
            builder: "",
        },
        {
            gasLimit: 4_000_000,
        }
    )
    console.log(tx)

    const codeId = Number(
        tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
            .value
    )
    console.log("codeId: ", codeId)

    const contractCodeHash = (
        await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
    ).code_hash;
    console.log(`Contract hash: ${contractCodeHash}`);
}

// upload_contract()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });

let codeId=2983
let contractCodeHash='cd18656fa631c85cab124f98cc3c0fdf6e2cde4ae2b00eca731d650547ddd938'

// codeId:  2983
// Contract hash: cd18656fa631c85cab124f98cc3c0fdf6e2cde4ae2b00eca731d650547ddd938


// 3. Instantiating the Contract
let instantiate_contract = async () => {
    // Create an instance of the Counter contract, providing a starting count
    const initMsg = { count: 0 }
    let tx = await secretjs.tx.compute.instantiateContract(
        {   
            code_id: codeId,
            sender: wallet.address,
            code_hash: contractCodeHash,
            init_msg: initMsg,
            label: "My Counter" + Math.ceil(Math.random() * 10000),
        },
        {
            gasLimit: 400_000,
        }
    )
    console.log(tx)

    // Find the contract_address in the logs
    const contractAddress = tx.arrayLog.find(
        (log) => log.type === "message" && log.key === "contract_address"
    ).value

    console.log(contractAddress)
}

// instantiate_contract()

// Uploaded and instantiated contract on a public Secret Network testnet
const contractAddress = "secret1gqy2klgu8qrk7qmz34ykyu99p793s7fzc68qe2"


// 4. Query Message to the Instantiated Contract
let try_query_count = async () => {
    const my_query = await secretjs.query.compute.queryContract({
        contract_address: contractAddress,
        code_hash: contractCodeHash,
        query: { get_count: {} },
    })
    console.log(my_query)
}

try_query_count();


// 5. Execute Message
let try_increment_count = async () => {
    let tx = await secretjs.tx.compute.executeContract(
        {
            sender: wallet.address,
            contract_address: contractAddress,
            code_hash: contractCodeHash,
            msg: {
                increment: {},
            },
            sent_funds: [], // optional
        },
        {
            gasLimit: 100_000,
        }
    )
    console.log("incrementing...")
}

// try_increment_count()