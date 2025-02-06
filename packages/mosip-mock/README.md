# mosip-mock

This simple mock is used to simulate the MOSIP API for local development.

## Mock NIDs

The mock considers every NID to be legitimate **EXCEPT**:

- `0000000000`
- `1111111111`
- `2222222222`
- `3333333333`
- `4444444444`
- `5555555555`
- `6666666666`
- `7777777777`
- `8888888888`
- `9999999999`

This means that:

- the ID Authentication for every NID not in the list **WILL PASS**
- on death every NID not in the list **WILL GET DEACTIVATED**
