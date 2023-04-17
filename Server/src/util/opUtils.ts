import { ethers } from "ethers";
import { UserOperationStruct } from "@account-abstraction/contracts";

export function toJSON(op: Partial<UserOperationStruct>): Promise<any> {
  return ethers.utils.resolveProperties(op).then((userOp) =>
    Object.keys(userOp)
      .map((key) => {
        let val = (userOp as any)[key];
        if (typeof val !== "string" || !val.startsWith("0x")) {
          if (key === "signature" && val === "") {
            val = "";
          } else {
            val = ethers.utils.hexValue(val);
          }
        }
        return [key, val];
      })
      .reduce(
        (set, [k, v]) => ({
          ...set,
          [k]: v,
        }),
        {}
      )
  );
}

export async function printOp(op: Partial<UserOperationStruct>): Promise<any> {
  // return toJSON(op).then((userOp) => JSON.stringify(userOp, null, 2));
  return toJSON(op).then((userOp) => userOp);
}
