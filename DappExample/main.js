async function connectWallet() {
	await ethereum.request({ method: 'eth_accounts' })
}

$(window).on('load', async () => {
	if (typeof window.ethereum === 'undefined') {
 		return
	}

    ethereum.on('connect', (connectInfo) => {
        console.log("connect")
        console.log(connectInfo)
	})

	ethereum.on('accountsChanged', (accounts) => {
        console.log("accountChanged")
        console.log(accounts)
	})

	if (ethereum.selectedAddress) {
        console.log(ethereum.selectedAddress)
	} else {
	}
})
