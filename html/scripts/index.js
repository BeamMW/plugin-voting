import Utils from "./utils.js"

const GROTHS_IN_BEAM = 100000000;
let localStorage = window.localStorage;
const PROPOSALS = [{
    "id": 0,
    "tid": "v1",
    "pid": "1100000000000000000000000000000000000000000000000000000000000000",
    "text": "Why is it called a soap opera when nobody sings?"
},{
    "id": 1,
    "tid": "v2",
    "pid": "2100000000000000000000000000000000000000000000000000000000000000",
    "text": "Why does the last piece of ice always stick to the bottom of the cup?"
},{
    "id": 2,
    "tid": "v3",
    "pid": "3100000000000000000000000000000000000000000000000000000000000000",
    "text": "Why do you click on start to leave Microsoft Windows?"
},{
    "id": 3,
    "tid": "v4",
    "pid": "4100000000000000000000000000000000000000000000000000000000000000",
    "text": "What do batteries run on?"
},{
    "id": 4,
    "tid": "v5",
    "pid": "5100000000000000000000000000000000000000000000000000000000000000",
    "text": "Which is the other side of the street?"
},{
    "id": 5,
    "tid": "v6",
    "pid": "6100000000000000000000000000000000000000000000000000000000000000",
    "text": "Why does Sea World have a seafood restaurant?"
},{
    "id": 6,
    "tid": "v7",
    "pid": "7100000000000000000000000000000000000000000000000000000000000000",
    "text": "Is a sleeping bull a bull-dozer?"
},{
    "id": 7,
    "tid": "v8",
    "pid": "8100000000000000000000000000000000000000000000000000000000000000",
    "text": "Can you cry under water?"
}];

class Faucet {
    constructor() {
        this.timeout = undefined;
        this.pluginData = {
            contractId: undefined,
            inTransaction: false,
            backlogPeriod: undefined,
            withdrawLimit: undefined,
            withdrawHeight: 0,
            currHeight: 0,

            bytes: null,
            positiveVotes: 0,
            negativeVotes: 0,
            positivePercentage: 0,
            negativePercentage: 0,
            voteClicked: false,
            selectedPROP: null,
            fromClicked: null
        }
    }

    setError = (errmsg) => {
        Utils.hide('faucet')
        Utils.setText('error', errmsg)
        if (this.timeout) {
            clearTimeout(this.timeout)   
        }
        this.timeout = setTimeout(() => {
            Utils.setText('error', "")
            this.start();
        }, 3000);
    }

    start = () => {
        Utils.download("./votingManager.wasm", (err, bytes) => {
            if (err) {
                let errTemplate = "Failed to load shader,";
                let errMsg = [errTemplate, err].join(" ");
                return this.setError(errMsg);
            }

            this.pluginData.bytes = bytes;
    
            // Utils.callApi("proposal_open", "invoke_contract", {
            //     contract: bytes,
            //     args: ["role=manager,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,action=proposal_open,pid=0000000000000000000000000000000000000000000000000000000000011129,hMin=2250,hMax=5000,num_variants=2,aid=0"].join("")
            // });
            // 

            // Utils.callApi("proposals_view_all", "invoke_contract", {
            //     contract: bytes,
            //     args: ["role=manager,action=proposals_view_all,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91"].join("")
            // })

            // Utils.callApi("proposal_view", "invoke_contract", {
            //     contract: bytes,
            //     args: ["role=my_account,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid=0000000000000000000000000000000000000000000000000000000000011129"].join("")
            // })
        })
    }
    
    refresh = (now) => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        // this.timeout = setTimeout(() => {
        //     Utils.callApi("user-view", "invoke_contract", {
        //         args: ["role=my_account,action=view,cid=", this.pluginData.contractId].join("")
        //     })
        // }, now ? 0 : 3000)
    }
    
    parseShaderResult = (apiResult) => {
        if (typeof(apiResult.output) != 'string') {
            throw "Empty shader response";
        }
    
        let shaderOut = JSON.parse(apiResult.output)
        if (shaderOut.error) {
            throw ["Shader error: ", shaderOut.error].join("")
        }
    
        return shaderOut
    }

    showProposalsList = () => {
        Utils.show('vote-list');
        Utils.hide('voting');

        let count = 1;
        for (let prop of PROPOSALS) {
            Utils.setText('vote' + count, prop.text);
            count++;
        }
    }

    showVoting = () => {
        Utils.hide('voted-positive');
        Utils.hide('voted-negative');
        Utils.show('voting');
        Utils.show('voting-main');
        Utils.hide('vote-list');
        Utils.setText('vote-for', this.pluginData.selectedPROP.text)
    }

    showNegativeVoted = () => {
        Utils.hide('voting-main');
        Utils.show('voting');
        Utils.hide('vote-list');
        Utils.show('voted-negative');
        Utils.setText('vote-for', this.pluginData.selectedPROP.text)
    }

    showPositiveVoted = () => {
        Utils.hide('voting-main');
        Utils.show('voting');
        Utils.hide('vote-list');
        Utils.show('voted-positive');
        Utils.setText('vote-for', this.pluginData.selectedPROP.text)
    }

    updateStats = () => {
        document.getElementById("positive-value").style.width = 560 * (this.pluginData.positivePercentage / 100);
        document.getElementById("negative-value").style.width = 560 * (this.pluginData.negativePercentage / 100);
    }

    showResults = () => {
        Utils.show('voting-results');
        Utils.setText('positive-percentage', this.pluginData.positivePercentage.toFixed(2) + "%");
        Utils.setText('negative-percentage', this.pluginData.negativePercentage.toFixed(2) + "%");
        // Utils.setText('positive-votes', "(" + this.pluginData.positiveVotes + " votes)");
        // Utils.setText('negative-votes', "(" + this.pluginData.negativeVotes + " votes)");
        this.updateStats();
    }

    onApiResult = (json) => {    
        try {
            const apiAnswer = JSON.parse(json);
            if (apiAnswer.error) {
                throw JSON.stringify(apiAnswer.error)
            }
    
            const apiCallId = apiAnswer.id;
            const apiResult = apiAnswer.result;
            if (!apiResult) {
                throw "Failed to call wallet API"
            }

            if (apiCallId == "proposal_view") {
                const shaderOut = this.parseShaderResult(apiResult);
                
                const voted = localStorage.getItem(this.pluginData.selectedPROP.tid);
                if (voted !== null || (shaderOut['My_Amount'] !== undefined && shaderOut['My_Amount'] > 0)) {
                    if (voted !== null && voted === 'yes') {
                        this.showPositiveVoted();
                    } else if (voted !== null && voted === 'no') {
                        this.showNegativeVoted();
                    }
                } else {
                    this.showVoting();                    
                }

                if (shaderOut['votes']['1'] > 0 || shaderOut['votes']['0'] > 0) {
                    this.pluginData.negativeVotes = shaderOut['votes']['1'] == undefined ? 0 : shaderOut['votes']['1'] / GROTHS_IN_BEAM;
                    this.pluginData.positiveVotes = shaderOut['votes']['0'] == undefined ? 0 : shaderOut['votes']['0'] / GROTHS_IN_BEAM;
                    const totalVotes = this.pluginData.negativeVotes + this.pluginData.positiveVotes;
                    this.pluginData.positivePercentage = (this.pluginData.positiveVotes / totalVotes) * 100;
                    this.pluginData.negativePercentage = (this.pluginData.negativeVotes / totalVotes) * 100;
                    this.showResults();
                } else {
                    Utils.hide('voting-results');
                }
            }
        }
        catch(err) 
        {
            return this.setError(err.toString())
        }
    }
}

Utils.onLoad(async (beamAPI) => {
    let faucet = new Faucet();
    Utils.getById('error').style.color = beamAPI.style.validator_error;

    // Utils.setText('issued', Utils.convertToNumberWithCommas(46456275));
    // Utils.setText('distributed', Utils.convertToNumberWithCommas(4417753));

    beamAPI.api.callWalletApiResult.connect(faucet.onApiResult);
    
    faucet.showProposalsList();
    faucet.start();

    Utils.getById('yes-button').addEventListener('click', (ev) => {
        Utils.show('deposit-popup');
        faucet.pluginData.fromClicked = true;
    });
    
    Utils.getById('no-button').addEventListener('click', (ev) => {
        Utils.show('deposit-popup');
        faucet.pluginData.fromClicked = false;
    });
    

    Utils.getById('cancel-button-popup-dep').addEventListener('click', (ev) => {
        Utils.hide('deposit-popup');
    });

    Utils.getById('deposit-input').addEventListener('keydown', (event) => {
        const specialKeys = [
            'Backspace', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
            'Control', 'Delete', 'F5'
          ];

        if (specialKeys.indexOf(event.key) !== -1) {
            return;
        }

        const current = Utils.getById('deposit-input').value;
        const next = current.concat(event.key);
      
        if (!Utils.handleString(next)) {
            event.preventDefault();
        }
    })

    Utils.getById('deposit-input').addEventListener('paste', (event) => {
        const text = event.clipboardData.getData('text');
        if (!Utils.handleString(text)) {
            event.preventDefault();
        }
    })

    Utils.getById('deposit-button-popup').addEventListener('click', (ev) => {
        const bigValue = new Big(Utils.getById('deposit-input').value);
        const value = bigValue.times(GROTHS_IN_BEAM);

        if (faucet.pluginData.fromClicked) {
            ev.preventDefault();
            if (!faucet.pluginData.voteClicked) {
                Utils.callApi("proposal_vote", "invoke_contract", {
                    contract: faucet.pluginData.bytes,
                    args: ["role=my_account,action=proposal_vote,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+faucet.pluginData.selectedPROP.pid+",amount="+value+",variant=0"].join("")
                })
                faucet.showPositiveVoted();
                localStorage.setItem(faucet.pluginData.selectedPROP.tid, 'yes');
                faucet.pluginData.voteClicked = true;
                faucet.updateStats();
                faucet.pluginData.fromClicked = null;
            }
        } else {
            ev.preventDefault();
            if (!faucet.pluginData.voteClicked) {
                Utils.callApi("proposal_vote", "invoke_contract", {
                    contract: faucet.pluginData.bytes,
                    args: ["role=my_account,action=proposal_vote,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+faucet.pluginData.selectedPROP.pid+",amount="+value+",variant=1"].join("")
                })
                faucet.showNegativeVoted();
                localStorage.setItem(faucet.pluginData.selectedPROP.tid, 'no');
                faucet.pluginData.voteClicked = true;
                faucet.updateStats();
                faucet.pluginData.fromClicked = null;
            }
        }

        Utils.hide('deposit-popup');
        // don't refresh here, need to wait until previous contract invoke completes
        ev.preventDefault();
        return false;
    });


    Utils.getById('back').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.showProposalsList();
    });

    Utils.getById('v1').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[0];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[0].pid].join("")
        })
    });

    Utils.getById('v2').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[1];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[1].pid].join("")
        })
    });
    Utils.getById('v3').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[2];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[2].pid].join("")
        })
    });
    Utils.getById('v4').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[3];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[3].pid].join("")
        })
    });
    Utils.getById('v5').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[4];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[4].pid].join("")
        })
    });
    Utils.getById('v6').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[5];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[5].pid].join("")
        })
    });
    Utils.getById('v7').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[6];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[6].pid].join("")
        })
    });
    Utils.getById('v8').addEventListener('click', (ev) => {
        ev.preventDefault();
        faucet.pluginData.selectedPROP = PROPOSALS[7];
        Utils.callApi("proposal_view", "invoke_contract", {
            contract: faucet.pluginData.bytes,
            args: ["role=manager,action=proposal_view,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,pid="+PROPOSALS[7].pid].join("")
        })
    });


    // Utils.getById('generate').addEventListener('click', (ev) => {
    //     ev.preventDefault();
    //     Utils.callApi("proposal_open", "invoke_contract", {
    //         contract: faucet.pluginData.bytes,
    //         args: ["role=manager,cid=f51d60d209cae23ab4398a6788d1526b347b329cb18630c099162a685606ef91,action=proposal_open,pid=8000000000000000000000000000000000000000000000000000000000000000,hMin=3400,hMax=6000,num_variants=2,aid=8"].join("")
    //     });
    // });
});