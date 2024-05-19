/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client"
import Modal from "@/components/Modal"
import React, { useState } from "react"

export default function Home() {
  const [showModal, setShowModal] = useState(true)
  const closeModal = () => setShowModal(false)
  const onDone = () => {
    setShowModal(false)
  }
  return (
    <>
      <div
        style={{
          minHeight: 500
        }}
      >
        <Modal show={showModal} onClose={closeModal} onDone={onDone} />
        <div>
          <img className="prompt-initial" src="/cornhub-website.png" width="1350" height="923" />
        </div>
      </div>
    </>
  )
}
