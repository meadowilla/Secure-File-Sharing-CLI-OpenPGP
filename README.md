## Secure File Sharing - CLI - OPENPGP
 ### Register a new user (or generate keypairs for the user)
 ``` 
 sfs register --username <username>
 ```

 ### Encrypt and sign file
 ``` 
 sfs encryptSign --file <file> --sender <sender> --receiver <receiver>
 ```

 ### Send encrypted file to receiver
 ``` 
 sfs send --ef <encryptedFile> --sender <sender> --receiver <receiver>
 ```

 ### Receive file

 ### Decrypt file and verify signature 
