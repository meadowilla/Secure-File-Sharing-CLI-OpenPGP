## Secure File Sharing - CLI - OPENPGP
 ### Register a new user (or generate keypairs for the user)
 ``` 
 sfs register --username <username>
 ```

 ### Encrypt and sign file
 ``` 
 sfs encryptSign --file <file> --sender <sender> --recipient <recipient>
 ```

 ### Send encrypted file to recipient
 ``` 
 sfs send --ef <encryptedFile> --sender <sender> --recipient <recipient>
 ```

 ### Receive file
 ```
 sfs receive --recipient <recipient>
 ```

 ### Verify signature and decrypt file
 ```
 sfs verifyDecrypt --signedMessageFile <signedMessageFile> --recipient <recipient> --sender <sender>
 ```
