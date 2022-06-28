import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { ethers } from 'ethers'
const {BigNumber} = require("ethers");
const { PoseidonHasher } = require('../utils/hasher');
const { exportCallDataGroth16 } = require("../zkproof/snarkjsZkproof");
const { MerkleTree } = require('fixed-merkle-tree');
import { useEffect, useState } from 'react'
import Web3Modal from "web3modal"

const buildPoseidon = require("circomlibjs").buildPoseidon;

import { mixupVerifierAddress, ethMixupAddress, commitmentHasherAddress, nullifierHasherAddress }from '../config'

import Verifier from '../abi/Verifier.json'
import ETHMixup from '../abi/ETHMixup.json'
import CommitmentHasher from '../abi/commitmentHasher.json'
import NullifierHasher from '../abi/nullifierHasher.json'
import { verify } from 'crypto';

export default function Home() {

  const [ note, setNote ] = useState('')
  const [ withdrawalNote, setWithdrawalNote ] = useState('')
  const [ recipient, setRecipient ] = useState('')
  const [ status, setStatus ] = useState('')

  function generateNote() {

    var pwdChars = "0123456789";
    var pwdLen = 52;
    var randPassword = Array(pwdLen).fill(pwdChars).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');

    setNote(randPassword)

    navigator.clipboard.writeText(randPassword)
    alert("Generated password added to your clipboard! Ensure to save somewhere")

  }

  async function deposit() {

      try{
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)

        const signer = provider.getSigner()
        const contract = new ethers.Contract(ethMixupAddress, ETHMixup.abi, signer)
        const commitmentHasher = new ethers.Contract(commitmentHasherAddress, CommitmentHasher.abi, signer)
        const nullifierHasher = new ethers.Contract(nullifierHasherAddress, NullifierHasher.abi, signer)

        const denomination = 10
        const secret = note
        const nullifier = await nullifierHasher["poseidon(uint256[1])"]([secret])
        const commit = await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

        const commitment = BigNumber.from(commit).toString()

        const price = ethers.utils.parseUnits(denomination.toString(), 'ether')

        const transaction = await contract.deposit(commitment, {
          value: price
        })

        await transaction.wait()
        alert("Deposit into Mixup was successful")

      }
      catch(error){
        alert(error.message)
      }
      
  }

  async function verify() {
    
    try{
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)

      const signer = provider.getSigner()

      const poseidon = new PoseidonHasher(await buildPoseidon());

      const commitmentHasher = new ethers.Contract(commitmentHasherAddress, CommitmentHasher.abi, signer)
      const nullifierHasher = new ethers.Contract(nullifierHasherAddress, NullifierHasher.abi, signer)
      const mixupVerifier = new ethers.Contract(mixupVerifierAddress, Verifier.abi, signer)

      const denomination = 10
      const secret = withdrawalNote
      const nullifier = await nullifierHasher["poseidon(uint256[1])"]([secret])
      const commit = await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

      const commitment = BigNumber.from(commit).toString()

      // initiate a new merkle tree instance
      const tree = new MerkleTree(10, [], {
          hashFunction: (secret, nullifier) => poseidon.hash(secret, nullifier).toString(), zeroElement: "21663839004416932945382355908790599225266501822907911457504978515578255421292"
      });

      // insert commitment into merkle tree
      tree.insert(commitment)

      const { pathElements, pathIndices, pathRoot } = tree.proof(commitment)

      // hash nullifier
      const nullifierHashObject = await nullifierHasher["poseidon(uint256[1])"]([nullifier])

      const input = {
          root: pathRoot,
          nullifier: nullifier.toString(),
          secret: secret,
          nullifierHash: nullifierHashObject.toString(),
          pathElements: pathElements,
          pathIndices: pathIndices
      }

      console.log(input)

      // generate proof data
      let dataResult = await exportCallDataGroth16(
          input,
          "/zkproof/Withdraw.wasm",
          "/zkproof/circuit_final.zkey"
      );

      // Call the verify proof function
      let result = await mixupVerifier.verifyProof(
        dataResult.a,
        dataResult.b,
        dataResult.c,
        dataResult.Input
      );

        setStatus("verified")

      if(result == true) alert("Your proof was successfully generated, you can go ahead to withdraw!")
    }
    catch(error){
      alert(error.message)
    }

  }

  async function withdraw() {
    
    try{
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)

      const signer = provider.getSigner()

      const poseidon = new PoseidonHasher(await buildPoseidon());

      const commitmentHasher = new ethers.Contract(commitmentHasherAddress, CommitmentHasher.abi, signer)
      const nullifierHasher = new ethers.Contract(nullifierHasherAddress, NullifierHasher.abi, signer)
      const mixupVerifier = new ethers.Contract(mixupVerifierAddress, Verifier.abi, signer)
      const contract = new ethers.Contract(ethMixupAddress, ETHMixup.abi, signer)

      const secret = withdrawalNote
      const nullifier = await nullifierHasher["poseidon(uint256[1])"]([secret])
      const commit = await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

      const commitment = BigNumber.from(commit).toString()

      // initiate a new merkle tree instance
      const tree = new MerkleTree(10, [], {
          hashFunction: (secret, nullifier) => poseidon.hash(secret, nullifier).toString(), zeroElement: "21663839004416932945382355908790599225266501822907911457504978515578255421292"
      });

      // insert commitment into merkle tree
      tree.insert(commitment)
      

      const { pathElements, pathIndices, pathRoot } = tree.proof(commitment)

      const root = await contract.roots(0)
      const rootCon = BigNumber.from(root).toString()
        console.log(rootCon)
        console.log(pathRoot)

      // hash nullifier
      const nullifierHashObject = await nullifierHasher["poseidon(uint256[1])"]([nullifier])

      const input = {
          root: pathRoot,
          nullifier: nullifier.toString(),
          secret: secret,
          nullifierHash: nullifierHashObject.toString(),
          pathElements: pathElements,
          pathIndices: pathIndices
      }

      console.log(input)
      // 4541946972422392857377524277636308025837776692276291

      // generate proof data
      let dataResult = await exportCallDataGroth16(
          input,
          "/zkproof/Withdraw.wasm",
          "/zkproof/circuit_final.zkey"
      );

      // initiate withdraw
      const tx = await contract.withdraw(dataResult.a, dataResult.b, dataResult.c, pathRoot, input.nullifierHash, recipient)

      await tx.wait()
      setStatus("unverified")
      alert("Your withdrawal was processed successfully!")
      window.location.reload()

    }
    catch(error){
      alert(error.message)
      // setStatus("unverified")
    }
    
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          ZK Privacy Mixer - <a href="#">Mixup</a>
        </h1>

        <p className={styles.description}>
          A non-custodial privacy solution based on{' '}
          <code className={styles.code}>zkSnarks!</code>
        </p>

        <div className={styles.grid}>
          <a href="#" className={styles.card}>
            <h2>Deposit &rarr;</h2>
            <p>Ensure to backup your note as you will need it for withdrawal</p>
            <div className={styles.note}>
              <input type="text" className={styles.input} placeholder="Enter Note" value={note} onChange={(e) => setNote(e.target.value)} />
              <input type="submit" className={styles.copyBtn} value="Generate Note" onClick={() => generateNote()} />
            </div>
            <p>This experimental version of Mixup supports only a denomination of 10 ONE.</p>
            <input type="submit" className={styles.button} value="Deposit" onClick={() => deposit()} />

            <h2 className={styles.withdraw}>Withdraw &rarr;</h2>
            <p>Enter Deposit secret Note</p>
            <input type="text" className={styles.input} placeholder="Enter Note" onChange={(e) => setWithdrawalNote(e.target.value)} />
            <p>For better anonymity, ensure to use a different wallet address from the depositor.</p>
            <input type="text" className={styles.input} placeholder="Enter Recipient" onChange={(e) => setRecipient(e.target.value)} />

            {
              status == "verified" ? '' : <input type="submit" className={styles.button} value="Verify Proof" onClick={() => verify()} />
            }

            {
              status == "verified" ? <input type="submit" className={styles.withdrawBtn} value="Withdraw" onClick={() => withdraw()} /> : ''
            }
            
          </a>
        </div>
      </main>
    </div>
  )
}
