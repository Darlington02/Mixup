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
require('dotenv').config()

const buildPoseidon = require("circomlibjs").buildPoseidon;

import { mixupVerifierAddress, commitmentHasherAddress, nullifierHasherAddress, ethMixupAddress10, ethMixupAddress1000, ethMixupAddress5000, ethMixupAddress10000, ethMixupAddress50000 }from '../config'

import Verifier from '../abi/Verifier.json'
import ETHMixup from '../abi/EthMixup.json'
import CommitmentHasher from '../abi/commitmentHasher.json'
import NullifierHasher from '../abi/nullifierHasher.json'
import { verify } from 'crypto';

export default function Home() {

  const [loading, setLoading] = useState(false)
  const [ note, setNote ] = useState('')
  const [ depositAmount, setDepositAmount ] = useState('')
  const [ withdrawalNote, setWithdrawalNote ] = useState('')
  const [ withdrawalAmount, setWithdrawalAmount ] = useState('')
  const [ recipient, setRecipient ] = useState('')
  const [ status, setStatus ] = useState('')

  function generateNote() {

    var pwdChars = "0123456789";
    var pwdLen = 52;
    var randPassword = Array(pwdLen).fill(pwdChars).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');

    setNote(randPassword)

    navigator.clipboard.writeText(randPassword)
    alert("Your generated note has been copied to your clipboard! Endeavour to back it up")

  }

  async function deposit() {

      try{
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        let contractAddress

        if(depositAmount == 1000){
          contractAddress = ethMixupAddress1000
        }
        else if(depositAmount == 5000){
          contractAddress = ethMixupAddress5000
        }
        else if(depositAmount == 10000){
          contractAddress = ethMixupAddress10000
        }
        else if(depositAmount == 50000){
          contractAddress = ethMixupAddress50000
        }
        else{
          contractAddress = ethMixupAddress10
        }

        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, ETHMixup.abi, signer)
        const commitmentHasher = new ethers.Contract(commitmentHasherAddress, CommitmentHasher.abi, signer)
        const nullifierHasher = new ethers.Contract(nullifierHasherAddress, NullifierHasher.abi, signer)

        const denomination = depositAmount
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

    setLoading(true)
    
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

      setLoading(false)
    }
    catch(error){
      alert(error.message)
    }

  }

  async function withdraw() {

    setLoading(true)
    
    try{
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)

      const signer = provider.getSigner()

      const poseidon = new PoseidonHasher(await buildPoseidon());

      let contractAddress

        if(withdrawalAmount == 1000){
          contractAddress = ethMixupAddress1000
        }
        else if(withdrawalAmount == 5000){
          contractAddress = ethMixupAddress5000
        }
        else if(withdrawalAmount == 10000){
          contractAddress = ethMixupAddress10000
        }
        else if(withdrawalAmount == 50000){
          contractAddress = ethMixupAddress50000
        }
        else{
          contractAddress = ethMixupAddress10
        }

      const commitmentHasher = new ethers.Contract(commitmentHasherAddress, CommitmentHasher.abi, signer)
      const nullifierHasher = new ethers.Contract(nullifierHasherAddress, NullifierHasher.abi, signer)
      const contract = new ethers.Contract(contractAddress, ETHMixup.abi, signer)

      const secret = withdrawalNote
      const nullifier = await nullifierHasher["poseidon(uint256[1])"]([secret])
      const commit = await commitmentHasher["poseidon(uint256[2])"]([secret, nullifier])

      const commitment = BigNumber.from(commit).toString()

      // initiate a new merkle tree instance
      const tree = new MerkleTree(10, [], {
          hashFunction: (secret, nullifier) => poseidon.hash(secret, nullifier).toString(), zeroElement: "12339540769637658105100870666479336797812683353093222300453955367174479050262"
      });

      const leaves = []
      const leavesLength = await contract.getLeavesLength()

      for(let i = 0; i < leavesLength; i++) {
        const leaf = await contract.leaves(i)
        const commitedCommitment = BigNumber.from(leaf).toString()
        leaves.push(commitedCommitment)
      }

      // insert commitment into merkle tree
      if(leaves.length == 1){
        tree.insert(...leaves)
      }
      else{
        tree.bulkInsert([...leaves])
      }

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

      // generate proof data
      let dataResult = await exportCallDataGroth16(
          input,
          "/zkproof/Withdraw.wasm",
          "/zkproof/circuit_final.zkey"
      );

      // initiate withdraw
      const webhook = `https://api.defender.openzeppelin.com/autotasks/${process.env.NEXT_PUBLIC_AUTOTASK_WEBHOOK}`
 
      let autotaskResponse = await fetch(
        webhook,
        {
          method: 'POST',
          body: JSON.stringify({ // Autotask webhook expects a JSON string in the request's body
            contractAddress: contractAddress,
            dataResultA: dataResult.a,
            dataResultB: dataResult.b,
            dataResultC: dataResult.c,
            root: input.root,
            nullifierHash: input.nullifierHash,
            recipient: recipient
          })
        }
      );

      const autotaskResult = await autotaskResponse.json();

      console.log(autotaskResult)

      if (autotaskResult.status === 'success') {
        alert("Your withdrawal was processed successfully!")
      } else {
        alert("There was an issue while processing your withdrawal, Try again!")
        console.error(`Autotask run failed with result ${JSON.stringify(autotaskResult)}`);
        return res.status(500).json({})
      }

      setLoading(false)
      window.location.reload()

    }
    catch(error){
      alert(error.message)
      setLoading(false)
      setStatus("unverified")
    }
    
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>ZK Privacy Mixer - Mixup</title>
        <meta name="description" content="ZK Privacy Mixer - Mixup" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          ZK Mixer - <a href="#">Mixup</a>
        </h1>

        <p className={styles.description}>
          A non-custodial privacy solution based on{' '}
          <code className={styles.code}>zkSnarks!</code>
        </p>

        {
          loading && (
            <div className={styles.spinnerWrapper}>
              <div className={styles.spinner}></div>
            </div>
          )
        }

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Deposit &rarr;</h2>
            <p className={styles.warning}>Ensure to backup your note as you will need it for withdrawal</p>
            <div className={styles.note}>
              <input type="text" className={styles.input} placeholder="Enter Note" value={note} onChange={(e) => setNote(e.target.value)} />
              <input type="submit" className={styles.copyBtn} value="Get Note" onClick={() => generateNote()} />
            </div>

            <p className={styles.warning}>Select Denomination</p>
            <div className={styles.denominations}>
              <label htmlFor="10" className="label">10</label>
              <input type="radio" name="denomination" id="10" value="10" onClick={() => setDepositAmount(10)} />
              <label htmlFor="1000" className="label">1000</label>
              <input type="radio" name="denomination" id="1000" value="1000" onClick={() => setDepositAmount(1000)} />
              <label htmlFor="5000" className="label">5000</label>
              <input type="radio" name="denomination" id="5000" value="5000" onClick={() => setDepositAmount(5000)} />
              <label htmlFor="10000" className="label">10000</label>
              <input type="radio" name="denomination" id="10000" value="10000" onClick={() => setDepositAmount(10000)} />
              <label htmlFor="50000" className="label">50000</label>
              <input type="radio" name="denomination" id="50000" value="50000" onClick={() => setDepositAmount(50000)} />
            </div>

            <input type="submit" className={styles.button} value="Deposit" onClick={() => deposit()} />

            <hr />
            <h2 className={styles.withdraw}>Withdraw &rarr;</h2>
            <p className={styles.warning}>Enter Deposit secret Note</p>

            <input type="text" className={styles.input} placeholder="Enter Note" onChange={(e) => setWithdrawalNote(e.target.value)} />

            <p className={styles.warning}>Select Denomination</p>
            <div className={styles.denominations}>
              <label htmlFor="w10" className="label">10</label>
              <input type="radio" name="denomination" id="w10" value="10" onClick={() => setWithdrawalAmount(10)} />
              <label htmlFor="w1000" className="label">1000</label>
              <input type="radio" name="denomination" id="w1000" value="1000" onClick={() => setWithdrawalAmount(1000)} />
              <label htmlFor="w5000" className="label">5000</label>
              <input type="radio" name="denomination" id="w5000" value="5000" onClick={() => setWithdrawalAmount(5000)} />
              <label htmlFor="w10000" className="label">10000</label>
              <input type="radio" name="denomination" id="w10000" value="10000" onClick={() => setWithdrawalAmount(10000)} />
              <label htmlFor="w50000" className="label">50000</label>
              <input type="radio" name="denomination" id="w50000" value="50000" onClick={() => setWithdrawalAmount(50000)} />
            </div>

            <input type="text" className={styles.input} placeholder="Enter Recipient" onChange={(e) => setRecipient(e.target.value)} />

            {
              status == "verified" ? '' : <input type="submit" className={styles.button} value="Verify Proof" onClick={() => verify()} />
            }

            {
              status == "verified" ? <input type="submit" className={styles.withdrawBtn} value="Withdraw" onClick={() => withdraw()} /> : ''
            }
            
          </div>
        </div>
      </main>
    </div>
  )
}
