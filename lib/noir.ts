import { BarretenbergBackend, CompiledCircuit, ProofData } from "@noir-lang/backend_barretenberg"
import { InputMap, Noir } from "@noir-lang/noir_js"
import proofOfAge from "../circuits/proof_age.json"

export async function proveSample() {
  const input = {
    mrz: [
      80, 60, 85, 84, 79, 83, 77, 73, 84, 72, 60, 60, 74, 79, 72, 78, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
      60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 49, 50, 51, 52, 53, 54, 55, 56, 57, 49, 85, 84,
      79, 56, 53, 48, 51, 50, 51, 56, 77, 50, 56, 48, 50, 49, 53, 52, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
      60, 60, 48, 48
    ],
    current_date: [50, 48, 50, 52, 48, 53, 49, 55],
    min_age_required: 18
  }
  return prove(proofOfAge as CompiledCircuit, input)
}

export async function prove(circuit: CompiledCircuit, inputs: InputMap) {
  const backend = new BarretenbergBackend(circuit)
  const noir = new Noir(circuit, backend)
  const proof = await noir.generateFinalProof(inputs)
  return proof
}

export async function verify(circuit: CompiledCircuit, proof: ProofData) {
  const backend = new BarretenbergBackend(circuit)
  const noir = new Noir(circuit, backend)
  const verification = await noir.verifyFinalProof(proof)
  return verification
}
