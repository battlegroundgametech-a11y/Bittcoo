const CONTRACT_ADDRESS = "0x4f5Df464846a232234C7190376c9660720910Fb8";

const CONTRACT_ABI = [
  "function freeMint(uint256 amount) external",
  "function paidMint(uint256 amount) external payable",
  "function totalMinted() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function MINT_PRICE() view returns (uint256)",
  "function freeMinted(address owner) view returns (uint256)",
  "function paidMinted(address owner) view returns (uint256)"
];

let walletAddress = "";
let freeAmount = 1;
let paidAmount = 1;
let mintPrice = "0.0001";

const walletBtn = document.querySelector(".wallet");

const mintedCount = document.getElementById("minted-count");
const supplyCount = document.getElementById("supply-count");

const freeUsed = document.getElementById("free-used");
const paidUsed = document.getElementById("paid-used");

const freeMinus = document.getElementById("free-minus");
const freePlus = document.getElementById("free-plus");
const freeAmountText = document.getElementById("free-amount");

const paidMinus = document.getElementById("paid-minus");
const paidPlus = document.getElementById("paid-plus");
const paidAmountText = document.getElementById("paid-amount");

const freeMintBtn = document.getElementById("free-mint-btn");
const paidMintBtn = document.getElementById("paid-mint-btn");

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function getContract(withSigner = false) {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    walletAddress = accounts[0];
    walletBtn.textContent = shortAddress(walletAddress);

    walletBtn.classList.add("wallet-animation");
    setTimeout(() => {
      walletBtn.classList.remove("wallet-animation");
    }, 800);

    await loadContractData();
  } catch (error) {
    alert(error.message || "Wallet connection failed.");
  }
}

async function loadContractData() {
  try {
    const contract = await getContract(false);

    const minted = await contract.totalMinted();
    const maxSupply = await contract.MAX_SUPPLY();
    const price = await contract.MINT_PRICE();

    mintPrice = ethers.formatEther(price);

    mintedCount.textContent = minted.toString();
    supplyCount.textContent = maxSupply.toString();

    paidMintBtn.textContent = `Paid Mint (${mintPrice} ETH each)`;

    if (walletAddress) {
      const freeMinted = await contract.freeMinted(walletAddress);
      const paidMinted = await contract.paidMinted(walletAddress);

      freeUsed.textContent = freeMinted.toString();
      paidUsed.textContent = paidMinted.toString();
    }
  } catch (error) {
    console.log("Contract data loading failed:", error);
  }
}

freeMinus.addEventListener("click", () => {
  freeAmount = Math.max(1, freeAmount - 1);
  freeAmountText.textContent = freeAmount;
});

freePlus.addEventListener("click", () => {
  freeAmount = Math.min(4, freeAmount + 1);
  freeAmountText.textContent = freeAmount;
});

paidMinus.addEventListener("click", () => {
  paidAmount = Math.max(1, paidAmount - 1);
  paidAmountText.textContent = paidAmount;
});

paidPlus.addEventListener("click", () => {
  paidAmount = Math.min(10, paidAmount + 1);
  paidAmountText.textContent = paidAmount;
});

async function freeMint() {
  try {
    freeMintBtn.classList.add("duck");
    setTimeout(() => {
      freeMintBtn.classList.remove("duck");
    }, 1300);

    if (!walletAddress) {
      await connectWallet();
    }

    freeMintBtn.textContent = "Minting...";

    const contract = await getContract(true);
    const tx = await contract.freeMint(freeAmount);

    freeMintBtn.textContent = "Waiting...";
    await tx.wait();

    freeMintBtn.textContent = "Free Mint Successful";

    await loadContractData();

    setTimeout(() => {
      freeMintBtn.textContent = "Free Mint";
    }, 2500);
  } catch (error) {
    freeMintBtn.textContent = "Free Mint";
    alert(error.reason || error.message || "Free mint failed.");
  }
}

async function paidMint() {
  try {
    paidMintBtn.classList.add("biceps");
    setTimeout(() => {
      paidMintBtn.classList.remove("biceps");
    }, 1300);

    if (!walletAddress) {
      await connectWallet();
    }

    paidMintBtn.textContent = "Minting...";

    const contract = await getContract(true);

    const totalPrice = Number(mintPrice) * paidAmount;
    const value = ethers.parseEther(totalPrice.toFixed(18));

    const tx = await contract.paidMint(paidAmount, { value });

    paidMintBtn.textContent = "Waiting...";
    await tx.wait();

    paidMintBtn.textContent = "Paid Mint Successful";

    await loadContractData();

    setTimeout(() => {
      paidMintBtn.textContent = `Paid Mint (${mintPrice} ETH each)`;
    }, 2500);
  } catch (error) {
    paidMintBtn.textContent = `Paid Mint (${mintPrice} ETH each)`;
    alert(error.reason || error.message || "Paid mint failed.");
  }
}

walletBtn.addEventListener("click", connectWallet);
freeMintBtn.addEventListener("click", freeMint);
paidMintBtn.addEventListener("click", paidMint);

loadContractData();
