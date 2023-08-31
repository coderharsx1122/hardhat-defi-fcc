const { getNamedAccounts, ethers } = require("hardhat")

const AMOUNT = ethers.utils.parseEther("0.02")

const getWeth = async () => {
    const { deployer } = await getNamedAccounts()

    // call the "deposit" function on the weth contract
    // for that we need abi✅ and contract address ✅
    // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2  -> weth mainnet address ✅
    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // mainnet forking
        deployer
    )
    const tx = await iWeth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethBal = await iWeth.balanceOf(deployer)
    console.log(`Balance : ${wethBal.toString()} WETH`)
}

module.exports = { getWeth,AMOUNT }