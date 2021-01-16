# ImageRepo

## Description

This is an image repository web application that allows users to create an account, login, upload and delete their images. 
Only users who uploaded the image have the option to delete it. The user can choose whether they want their photos to be public or private.
A user must be logged in to upload images, however, they can view public images without logging in.

## Login Information

User can choose to create their own account, however, for testing purposes, you can use the following account:

```bash
username: nav
password: nav
```

## Live Website Link

https://nameless-savannah-87648.herokuapp.com/

## Please Note

Some things to consider when testing this app:
The files are being stores on the heroku server's local directory, which means it has a certain limit. 
Heroku's file structure deletes uploaded images automatically after a certain time. 
For this test demostration, the file upload limit is 10 and the application can take a couple of seconds to finish uploading. 

## Demo

https://www.youtube.com/watch?v=fwSYuRh9vyA&feature=youtu.be

## TODO

- [x] Upload multiple images
- [x] Creating user session
- [x] Error handling for file uploads
- [x] Deleting single images
- [x] Deleting all user images
- [x] Login Authentication
- [x] Private and Public Images
- [x] Error handling for file type and size
- [ ] Use Amazon S3 file system to store images
- [ ] Delete selected images
- [ ] Edit image privacy settings (private/public) after upload
- [ ] Adding drag and drop upload option
- [ ] Implement intersection observer API to load more data on scroll



