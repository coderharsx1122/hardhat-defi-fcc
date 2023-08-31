const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")

const main = async () => {
    // the protocols treate everythinga as erc20 token
    await getWeth()
    const { deployer } = await getNamedAccounts()

    // intract with aave
    // we need -> abi,address✅
    // Landing pool address provider(aave)=> 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    const lendingPool = await getLandingPool(deployer)
    console.log(`lending pool ${lendingPool.address}`)

    // deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    // approve aave to deposit
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing.....")
    lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("deposited")
    console.log("Fetching user data")
    let { availableBorrowsETH, totalDebtETH } = await getBorrowerData(lendingPool, deployer)

    // Borrow
    // how much we have borrowed , how much we can borrow
    const daiPrice = await getDiePrice()
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`amount dai can borrow ${amountDaiToBorrow}`)
    console.log(`amount dai can borrow in wei ${amountDaiToBorrowWei}`)
    const daiTokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
    await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer)
    await getBorrowerData()
}


const borrowDai = async(daiAddress, lendingPool, amountDaiToBorrow, account)=> {
    console.log("Borrowing...")
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account)
    await borrowTx.wait(1)
    console.log("You've borrowed!")
}

const getDiePrice = async () => {
    // do not need deployer as we are just reading
    // reading don't need a signer, reading need a signer
    const dieEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface", "0x773616E4d11A78F511299002da57A0a94577F1f4")
    const price = (await dieEthPriceFeed.latestRoundData())[1]
    console.log(`You can buy ${price.toString()} worth of eth`)
    return price
}

const getBorrowerData = async (lendingPool, account) => {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account)

    console.log(`Total collateral ${totalCollateralETH}`)
    console.log(`Total debt ${totalDebtETH}`)
    console.log(`Available borrow eth ${availableBorrowsETH}`)
    return { availableBorrowsETH, totalDebtETH }
}


const getLandingPool = async (account) => {
    const ILendingPoolAddressProvider = await ethers.getContractAt("ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingPoolAddress = await ILendingPoolAddressProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}


const approveERC20 = async (erc20Address, spenderAddress, amountToSpend, account) => {

    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)

}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e)
        process.exit(1)
    })

