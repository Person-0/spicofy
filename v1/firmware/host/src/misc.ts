import * as readline from "readline";

const rlinterface = readline.createInterface(
    { input: process.stdin, output: process.stdout }
);

const asyncQuestion = (query: string) => new Promise((resolve) => {
    rlinterface.question(query, (ans) => resolve(ans));
});

type ChoiceResult =
    | {
        cancelled: true;
        choiceData: null;
    }
    | {
        cancelled: false;
        choiceData: any;
    };

export async function choiceSelect(choices: any[]): Promise<ChoiceResult> {
    console.log("Please select one of the following choices:");
    let didCancel = false;
    for (const choice of choices) {
        console.log("");
        console.log(
            "Is this your choice? ([y] for Yes, [n] for No, [x] for Cancel)"
        );
        console.log(choice);
        const ans = (await asyncQuestion(">> ") as string)
            .replaceAll(" ", "")
            .toLowerCase();
        if (ans === "y") {
            return {
                cancelled: false,
                choiceData: choice
            };
        } else if (ans === "x") {
            didCancel = true
            break;
        }
    }
    return {
        cancelled: didCancel,
        choiceData: null
    };
}

/**
 * only use to test!!!
 */
export const samplePortResponse = [
    {
        path: "/dev/ttyACM0",
        manufacturer: "Raspberry Pi",
        serialNumber: "E6616408432F5E2B",
        vendorId: "2e8a",
        productId: "000a"
    },
    {
        path: "/dev/ttyUSB0",
        manufacturer: "Arduino LLC",
        serialNumber: "8543032303235180E1F0",
        vendorId: "2341",
        productId: "0043"
    },
    {
        path: "/dev/cu.Bluetooth-Incoming-Port",
        manufacturer: undefined,
        serialNumber: undefined,
        vendorId: undefined,
        productId: undefined
    },
    {
        path: "/dev/ttyS0",
        manufacturer: undefined,
        serialNumber: undefined,
        vendorId: undefined,
        productId: undefined
    }
]