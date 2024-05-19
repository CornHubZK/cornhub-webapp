/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import "./Modal.css"
import { useEffect, useRef, useState } from "react"
import { useQRCode } from "next-qrcode"
import { verify } from "@/lib/noir"
import { hexToBytesArray, numberToFieldString } from "@/lib"
import { ProofRequest } from "@/types"
import { format } from "date-fns"
import { CompiledCircuit, ProofData } from "@noir-lang/backend_barretenberg"
import { ContractInterface, ethers } from "ethers"
import proofOfAge from "@/circuits/proof_age.json"
import { abi } from "@/contracts/UltraVerifier.json"

const SERVER_URL = "https://ocelots-beta-server-f8ada60e3d7d.herokuapp.com"
const CONTRACT_ADDRESS = "0x2316dd6ebee530dC6bB2f54941Cd5742B2efB9AD"

export async function verifyOnChain(proof: ProofData) {
  const provider = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com")
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi as unknown as ContractInterface, provider)
  const publicInputs: string[] = []
  proof.publicInputs.forEach((value) => {
    publicInputs.push(value)
  })
  const verified = await contract.verify(proof.proof, publicInputs)
  return verified
}

function QRCode({ url }: { url: string }) {
  const { Canvas } = useQRCode()
  return (
    <Canvas
      text={url}
      options={{
        errorCorrectionLevel: "L",
        margin: 2,
        width: 200,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      }}
    />
  )
}

export default function Modal({ show, onClose, onDone }: any) {
  const [step, setStep] = useState(1)
  const [url, setUrl] = useState("")
  const [proofRequest, setProofRequest] = useState<ProofRequest>()
  const [pollingHandle, setPollingHandle] = useState<NodeJS.Timeout | undefined>()
  const [pollingId, setPollingId] = useState<string | undefined>()
  const [isVisible, setIsVisible] = useState(true)
  const modalRef = useRef(null)

  const handleClose = () => {
    setIsVisible(false)
  }

  const onVerify = async () => {
    const response = await fetch(`${SERVER_URL}/request/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        min_age: 18,
        current_date: format(new Date(), "yyyyMMdd")
      })
    })

    if (!response.ok) {
      return
    }
    const pr: ProofRequest = await response.json()
    console.log(`Created proof request ${pr.id}`)
    setPollingId(pr.id)
    setProofRequest(pr)
    setUrl(`"https://zkpassport.app/request?c=200&aa=18&d=ch&uid=${pr.id}`)
    setStep(2)
  }

  // Poll for updates
  useEffect(() => {
    if (pollingId === undefined || proofRequest === undefined) return
    const handle = setInterval(async () => {
      const response = await fetch(`${SERVER_URL}/request/${pollingId}`)
      const latestProofRequest: ProofRequest = await response.json()
      console.log("Response status:", latestProofRequest.status)
      if (latestProofRequest.status !== proofRequest.status) {
        setProofRequest(latestProofRequest)
      }
    }, 2000)
    setPollingHandle(handle)
    return () => {
      clearInterval(handle)
    }
  }, [pollingId, proofRequest])

  // Handle state changes from polling response
  useEffect(() => {
    if (proofRequest === undefined) return
    if (proofRequest.status === "pending" && step !== 3) {
      setStep(3)
      return
    }
    if (proofRequest.status === "accepted" && step !== 4) {
      setStep(4)
      return
    }
    if (proofRequest.status === "verified" && !!proofRequest.proof) {
      console.log("Server verified proof successfully!")
      console.log("Stopping polling")
      clearInterval(pollingHandle)
      verifyProof(proofRequest).then((verified) => {
        console.log(`verified: ${verified}`)
        handleClose()
      })
      return
    }
  }, [pollingHandle, proofRequest, step])

  const verifyProof = async (pr: ProofRequest) => {
    console.log("Verifying proof:", pr.proof)
    const currentDataBytes = new TextEncoder().encode(pr.current_date)

    const publicInputs = new Map()
    for (let i = 0; i < currentDataBytes.length; i++) {
      publicInputs.set(
        proofOfAge.abi.param_witnesses.current_date[0].start + i,
        numberToFieldString(currentDataBytes[i])
      )
    }
    publicInputs.set(proofOfAge.abi.param_witnesses.min_age_required[0].start, numberToFieldString(pr.min_age!))

    const fullProof: ProofData = {
      proof: hexToBytesArray(pr.proof!),
      publicInputs
    }

    const verified = await verify(proofOfAge as CompiledCircuit, fullProof)
    console.log("verified locally:", verified)

    const verifiedOnChain = await verifyOnChain(fullProof)
    console.log("verifiedOnChain:", verifiedOnChain)

    return verified
  }

  if (!show) {
    return null
  }
  const onVerifyAgeClick = () => {
    onVerify()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <div className="button-container">
              <button className="verify-age-button" onClick={() => onVerifyAgeClick()}>
                Verify Age
              </button>
              <button className="exit-button">I am under 18 - Exit</button>
            </div>
            <img className="prompt-initial" src="/prompt-initial.png" width="780" height="520" />
          </div>
        )
      case 2:
        return (
          <div>
            <div
              onClick={() => setStep(3)}
              className="bg-white mt-3 ml-3 qr-code-container"
              style={{ borderRadius: 3, width: 200, height: 200, overflow: "hidden" }}
            >
              <QRCode url={url} />
            </div>
            <img className="prompt-initial" src="/prompt-qr.png" width="780" height="520" />
          </div>
        )
      case 3:
        return (
          <div onClick={() => setStep(4)}>
            <img className="prompt-initial" src="/prompt-qr-approve.png" width="780" height="520" />
          </div>
        )
      case 4:
        return <img className="prompt-initial" src="/pending.gif" width="780" height="520" />
      case 5:
        return <div>DONE!</div>
      default:
        return null
    }
  }

  return (
    <div className={`modal-overlay ${!isVisible ? "fade-out" : ""}`} ref={modalRef}>
      <div className="modal-content">{renderStep()}</div>
    </div>
  )
}
