/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/bomboclat.json`.
 */
export type Bomboclat = {
  "address": "9Ky8dWgozFkGQJBUfrgEy3zxbMmXdX5XYCV6FL4VUXjC",
  "metadata": {
    "name": "bomboclat",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "claimAfterFinalization",
      "discriminator": [
        228,
        112,
        62,
        191,
        95,
        234,
        28,
        85
      ],
      "accounts": [
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "auctionData"
        },
        {
          "name": "slotBid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  111,
                  116,
                  95,
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              },
              {
                "kind": "arg",
                "path": "slotId"
              }
            ]
          }
        },
        {
          "name": "auctionEscrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "claimerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "claimer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "slotId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closeAuctionAccounts",
      "discriminator": [
        137,
        228,
        185,
        246,
        164,
        141,
        146,
        22
      ],
      "accounts": [
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "auctionData",
          "writable": true
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "treasuryAuthority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createTokenAndAuction",
      "discriminator": [
        2,
        117,
        243,
        136,
        101,
        39,
        140,
        197
      ],
      "accounts": [
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "auctionData",
          "writable": true,
          "signer": true
        },
        {
          "name": "auctionState",
          "writable": true,
          "signer": true
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auctionData"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "auctionEscrow"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryAuthorityAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasuryAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryAuthority"
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "durationOption",
          "type": "u8"
        }
      ]
    },
    {
      "name": "distributeProtocolFees",
      "discriminator": [
        209,
        221,
        19,
        223,
        218,
        191,
        130,
        148
      ],
      "accounts": [
        {
          "name": "auctionState"
        },
        {
          "name": "auctionData"
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "treasuryAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endAuction",
      "discriminator": [
        252,
        110,
        101,
        234,
        66,
        104,
        28,
        87
      ],
      "accounts": [
        {
          "name": "auctionData",
          "writable": true
        },
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "treasuryAuthority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    },
    {
      "name": "getSolForMig",
      "discriminator": [
        166,
        9,
        115,
        175,
        30,
        67,
        94,
        118
      ],
      "accounts": [
        {
          "name": "auctionState"
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "treasuryAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "outbid",
      "discriminator": [
        41,
        93,
        237,
        83,
        211,
        186,
        9,
        122
      ],
      "accounts": [
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "auctionData"
        },
        {
          "name": "slotBid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  111,
                  116,
                  95,
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              },
              {
                "kind": "arg",
                "path": "slotId"
              }
            ]
          }
        },
        {
          "name": "bidder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bidderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bidder"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "previousBidder",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "slotId",
          "type": "u64"
        },
        {
          "name": "bidAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "placeFirstBid",
      "discriminator": [
        50,
        237,
        83,
        117,
        143,
        191,
        125,
        217
      ],
      "accounts": [
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "auctionData"
        },
        {
          "name": "slotBid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  111,
                  116,
                  95,
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auctionData"
              },
              {
                "kind": "arg",
                "path": "slotId"
              }
            ]
          }
        },
        {
          "name": "bidder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bidderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bidder"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auctionData"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "slotId",
          "type": "u64"
        },
        {
          "name": "bidAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "wrapUpFailed",
      "discriminator": [
        224,
        237,
        187,
        3,
        76,
        20,
        94,
        235
      ],
      "accounts": [
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "auctionData",
          "writable": true
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "slotBid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  111,
                  116,
                  95,
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              },
              {
                "kind": "arg",
                "path": "slotId"
              }
            ]
          }
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "bidder",
          "writable": true
        },
        {
          "name": "treasuryAuthority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "slotId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "wrapUpSuccessful",
      "discriminator": [
        191,
        100,
        35,
        201,
        58,
        139,
        139,
        241
      ],
      "accounts": [
        {
          "name": "auctionState",
          "writable": true
        },
        {
          "name": "auctionData",
          "writable": true
        },
        {
          "name": "auctionEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "slotBid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  111,
                  116,
                  95,
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auction_state.auction_data",
                "account": "auctionState"
              },
              {
                "kind": "arg",
                "path": "slotId"
              }
            ]
          }
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "bidder",
          "writable": true
        },
        {
          "name": "bidderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bidder"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryAuthority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "slotId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "auctionData",
      "discriminator": [
        72,
        15,
        100,
        35,
        242,
        55,
        1,
        93
      ]
    },
    {
      "name": "auctionState",
      "discriminator": [
        252,
        227,
        205,
        147,
        72,
        64,
        250,
        126
      ]
    },
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "slotBid",
      "discriminator": [
        86,
        88,
        100,
        119,
        88,
        135,
        143,
        98
      ]
    }
  ],
  "events": [
    {
      "name": "auctionAccountsClosed",
      "discriminator": [
        12,
        143,
        196,
        60,
        6,
        34,
        238,
        87
      ]
    },
    {
      "name": "auctionEnded",
      "discriminator": [
        91,
        165,
        139,
        202,
        204,
        215,
        92,
        52
      ]
    },
    {
      "name": "auctionExtended",
      "discriminator": [
        204,
        229,
        238,
        200,
        189,
        21,
        50,
        41
      ]
    },
    {
      "name": "auctionFinalized",
      "discriminator": [
        136,
        160,
        117,
        237,
        77,
        211,
        136,
        28
      ]
    },
    {
      "name": "auctionInitialized",
      "discriminator": [
        18,
        7,
        64,
        239,
        134,
        184,
        173,
        108
      ]
    },
    {
      "name": "auctionTypeDecided",
      "discriminator": [
        81,
        119,
        91,
        43,
        228,
        106,
        30,
        65
      ]
    },
    {
      "name": "auctionWrapUp",
      "discriminator": [
        15,
        17,
        203,
        54,
        251,
        82,
        1,
        125
      ]
    },
    {
      "name": "bidPlaced",
      "discriminator": [
        135,
        53,
        176,
        83,
        193,
        69,
        108,
        61
      ]
    },
    {
      "name": "protocolFeesDistributed",
      "discriminator": [
        40,
        79,
        148,
        12,
        160,
        223,
        149,
        93
      ]
    },
    {
      "name": "refundClaimed",
      "discriminator": [
        136,
        64,
        242,
        99,
        4,
        244,
        208,
        130
      ]
    },
    {
      "name": "refundProcessed",
      "discriminator": [
        203,
        88,
        236,
        233,
        192,
        178,
        57,
        161
      ]
    },
    {
      "name": "slotMarkedClaimable",
      "discriminator": [
        58,
        201,
        138,
        152,
        27,
        44,
        77,
        236
      ]
    },
    {
      "name": "solTransferredToTreasury",
      "discriminator": [
        34,
        221,
        54,
        21,
        184,
        81,
        152,
        167
      ]
    },
    {
      "name": "tokensClaimed",
      "discriminator": [
        25,
        128,
        244,
        55,
        241,
        136,
        200,
        91
      ]
    },
    {
      "name": "tokensDistributed",
      "discriminator": [
        117,
        252,
        224,
        3,
        212,
        156,
        207,
        43
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidEscrowPda",
      "msg": "Invalid escrow PDA provided"
    },
    {
      "code": 6001,
      "name": "accountClosed",
      "msg": "Account is closed or has zero lamports"
    },
    {
      "code": 6002,
      "name": "treasuryDoesNotHoldAllSupply",
      "msg": "Treasury does not hold the required token supply"
    },
    {
      "code": 6003,
      "name": "invalidAuctionData",
      "msg": "Invalid auction data provided"
    },
    {
      "code": 6004,
      "name": "invalidTokenUri",
      "msg": "Invalid token URI provided"
    },
    {
      "code": 6005,
      "name": "invalidProgramId",
      "msg": "Invalid program ID provided"
    },
    {
      "code": 6006,
      "name": "invalidMetadataPda",
      "msg": "Invalid metadata PDA"
    },
    {
      "code": 6007,
      "name": "bidTooLow",
      "msg": "Bid amount is too low"
    },
    {
      "code": 6008,
      "name": "bidTooHigh",
      "msg": "Bid amount is too high"
    },
    {
      "code": 6009,
      "name": "invalidSlotId",
      "msg": "Invalid slot ID"
    },
    {
      "code": 6010,
      "name": "reentrancyDetected",
      "msg": "Reentrancy detected"
    },
    {
      "code": 6011,
      "name": "invalidEscrowAccount",
      "msg": "Invalid escrow account"
    },
    {
      "code": 6012,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6013,
      "name": "insufficientBalance",
      "msg": "Insufficient balance for operation"
    },
    {
      "code": 6014,
      "name": "auctionAlreadyActive",
      "msg": "Auction is already active"
    },
    {
      "code": 6015,
      "name": "auctionNotActive",
      "msg": "Auction is not active"
    },
    {
      "code": 6016,
      "name": "cannotBidAgainstSelf",
      "msg": "Cannot outbid yourself"
    },
    {
      "code": 6017,
      "name": "bidIncrementTooHigh",
      "msg": "Fat finger protection triggered"
    },
    {
      "code": 6018,
      "name": "invalidBidderAccount",
      "msg": "Invalid bidder account"
    },
    {
      "code": 6019,
      "name": "duplicateMutableAccounts",
      "msg": "Duplicate accounts detected"
    },
    {
      "code": 6020,
      "name": "auctionNotReadyToFinalize",
      "msg": "Auction is not ready to finalize"
    },
    {
      "code": 6021,
      "name": "invalidBidAmount",
      "msg": "Invalid bid amount"
    },
    {
      "code": 6022,
      "name": "claimPeriodExpired",
      "msg": "Claim period has expired"
    },
    {
      "code": 6023,
      "name": "insufficientEscrowBalance",
      "msg": "Insufficient escrow balance"
    },
    {
      "code": 6024,
      "name": "auctionAlreadyFinalized",
      "msg": "Auction is already finalized"
    },
    {
      "code": 6025,
      "name": "tokensAlreadyDistributed",
      "msg": "Tokens have already been distributed"
    },
    {
      "code": 6026,
      "name": "insufficientTokenBalance",
      "msg": "Insufficient token balance"
    },
    {
      "code": 6027,
      "name": "unauthorizedCaller",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6028,
      "name": "deserializationFailed",
      "msg": "Deserialization failed"
    },
    {
      "code": 6029,
      "name": "invalidBidderTokenAccount",
      "msg": "Invalid bidder token account"
    },
    {
      "code": 6030,
      "name": "tokenMintMismatch",
      "msg": "Token mint mismatch"
    },
    {
      "code": 6031,
      "name": "accountAlreadyInitialized",
      "msg": "Account is already initialized"
    },
    {
      "code": 6032,
      "name": "slotNotClaimable",
      "msg": "Slot is not claimable"
    },
    {
      "code": 6033,
      "name": "invalidTreasuryAuthority",
      "msg": "Invalid treasury authority"
    },
    {
      "code": 6034,
      "name": "claimPeriodNotExpired",
      "msg": "Claim period has not expired"
    },
    {
      "code": 6035,
      "name": "auctionFailed",
      "msg": "Auction has not reached the required amount to migrate"
    },
    {
      "code": 6036,
      "name": "auctionSuccessful",
      "msg": "Auction is successful and will migrate"
    },
    {
      "code": 6037,
      "name": "auctionNotFinalized",
      "msg": "Auction not finalized"
    },
    {
      "code": 6038,
      "name": "invalidAuctionDuration",
      "msg": "Auction should last 1m 1h or 1d"
    },
    {
      "code": 6039,
      "name": "allSlotsMustBeProcessed",
      "msg": "Process all slots before finalizing"
    },
    {
      "code": 6040,
      "name": "alreadyTransferred",
      "msg": "SOL has already been transferred to treasury"
    },
    {
      "code": 6041,
      "name": "feesAlreadyDistributed",
      "msg": "Protocol fees have already been distributed"
    },
    {
      "code": 6042,
      "name": "solNotYetTransferred",
      "msg": "SOL must be transferred to treasury before distributing fees"
    },
    {
      "code": 6043,
      "name": "feesNotDistributed",
      "msg": "Fees must be distributed before closing accounts"
    }
  ],
  "types": [
    {
      "name": "auctionAccountsClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "rentRecovered",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "auctionDuration",
            "type": "i64"
          },
          {
            "name": "maxBidIncrement",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "auctionActive",
            "type": "bool"
          },
          {
            "name": "feeReceiver",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "auctionEnded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionExtended",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "newEndTime",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "tokenName",
            "type": "string"
          },
          {
            "name": "tokenSymbol",
            "type": "string"
          },
          {
            "name": "tokenUri",
            "type": "string"
          },
          {
            "name": "auctionDuration",
            "type": "i64"
          },
          {
            "name": "maxBidIncrement",
            "type": "u64"
          },
          {
            "name": "legendaryTokens",
            "type": "u64"
          },
          {
            "name": "artefactTokens",
            "type": "u64"
          },
          {
            "name": "rareTokens",
            "type": "u64"
          },
          {
            "name": "magicTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "auctionState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "auctionData",
            "type": "pubkey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "maxBidIncrement",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "name": "legendaryTokens",
            "type": "u64"
          },
          {
            "name": "artefactTokens",
            "type": "u64"
          },
          {
            "name": "rareTokens",
            "type": "u64"
          },
          {
            "name": "magicTokens",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "isProcessing",
            "type": "bool"
          },
          {
            "name": "processedSlots",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "auctionTypeDecided",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "isSuccessful",
            "type": "bool"
          },
          {
            "name": "totalRaised",
            "type": "u64"
          },
          {
            "name": "minimumRequired",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionWrapUp",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "lamportsRecovered",
            "type": "u64"
          },
          {
            "name": "protocolProfit",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "bidPlaced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "bidder",
            "type": "pubkey"
          },
          {
            "name": "slotId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "solTransferred",
            "type": "bool"
          },
          {
            "name": "feesDistributed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "protocolFeesDistributed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "feeReceiver",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "refundClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "slotId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "refundProcessed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "bidder",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "slotBid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auctionData",
            "type": "pubkey"
          },
          {
            "name": "slotId",
            "type": "u64"
          },
          {
            "name": "currentBidder",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "currentAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "distributed",
            "type": "bool"
          },
          {
            "name": "claimable",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "slotMarkedClaimable",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "slotId",
            "type": "u64"
          },
          {
            "name": "bidder",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "claimType",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "solTransferredToTreasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tokensClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "slotId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tokensDistributed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "slotId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
