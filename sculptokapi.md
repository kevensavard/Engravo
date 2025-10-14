Credits api:

Credits
Get the current Credits in the account
URL: https://api.sculptok.com/api-open/point/info
Method: GET
Response Fields
point
number
The current Credits in the account.
Code Examples
Request Headers
Copy
{
  "Content-Type": "application/json",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "point": 100
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}

Credits history:

GET
Credits History
Get the history of Credits in the account
URL: https://api.sculptok.com/api-open/point/page
Method: GET
Request Parameters
limit
Optional
number
The number of returns of the current history
page
Optional
string
The postion of page
Response Fields
remainValue
number
remaining Credits
changeNum
number
Number of Credits changed
remarks
string
Events that change Credits
Code Examples
Request Params
Copy
{
  "limit": 5,
  "page": "1"
}
Request Headers
Copy
{
  "Content-Type": "application/json",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 1,
    "list": [
      {
        "id": "1888956880713715713",
        "userId": "1881280564795301889",
        "actionType": 5,
        "remainValue": 26,
        "changeNum": -10,
        "remarks": "API Draw: 65c42194-af36-45ed-a833-4058b569622d",
        "createDate": "2025-02-10 22:23:10"
      }
    ]
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}


Upload image: 
POST
Upload Image
The first step to generate depth-map: Upload the image to the server
URL: https://api.sculptok.com/api-open/image/upload
Method: POST
Request Parameters
file
Required
file
The image you would like to upload.
Response Fields
src
string
The address of the identifier returned for the successfully uploaded image.
Code Examples
Request Body
Copy
{
  "file": "image.jpg"
}
Request Headers
Copy
{
  "Content-Type": "multipart/form-data;",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "src": "https://mock/step_api/mock.png"
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}


Submit draw:

POST
Submit Draw
After upload image: Submit the drawing task. Notice: Calling this API will cost 10 Credits.
URL: https://api.sculptok.com/api-open/draw/prompt
Method: POST
Request Parameters
imageUrl
Required
string
The Image Url from Upload Image API.
style
Optional
string
Type of image you uploaded. One of the following: normal, portrait, sketch, pro. Default: normal.
Options:
normal
portrait
sketch
pro
hd_fix
Optional
string
Enable or disable AI Optimization. Set to 'auto' to enable AI Optimization, or 'manual' to disable it. Default: manual.
Options:
auto
manual
optimal_size
Optional
string
Enable or disable optimal size. Set to 'true' to enable optimal size, or 'false' to disable it. Default: true.
Options:
true
false
Response Fields
promptId
string
The identifier returned for the successfully submitted drawing.
Code Examples
Request Body
Copy
{
  "imageUrl": "https://mock.png"
}
Request Headers
Copy
{
  "Content-Type": "application/json",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "promptId": "4ffaf48f-6b00-4312-b592-2efb07597e93"
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}


Submit 3d draw:

POST
Submit 3D Draw
After upload image: Submit the 3D drawing task. Notice: Calling this API will cost 10 Credits.
URL: https://api.sculptok.com/api-open/draw/3d/prompt
Method: POST
Request Parameters
imageUrl
Required
string
The Image Url from Upload Image API.
hd_fix
Optional
string
precision of image you uploaded. One of the following: basic, standard, high. Default: basic.
Options:
basic
standard
high
Response Fields
promptId
string
The identifier returned for the successfully submitted drawing.
Code Examples
Request Body
Copy
{
  "imageUrl": "https://mock.png"
}
Request Headers
Copy
{
  "Content-Type": "application/json",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "promptId": "4ffaf48f-6b00-4312-b592-2efb07597e93"
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}


Drawing status:

GET
Drawing Status
URL: https://api.sculptok.com/api-open/draw/prompt
Method: GET
Request Parameters
uuid
Required
string
The promptId from Submit Draw API.
Response Fields
upImageUrl
string
The image URL of the uploaded image.
position
number
the position in the queue.
imgRecords
array
The image URL of generated depth-map. The total length is 3.
Code Examples
Request Params
Copy
{
  "uuid": "4ffaf48f-6b00-4312-b592-2efb07597e93"
}
Request Headers
Copy
{
  "Content-Type": "application/json",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "1878376954302496770",
    "currentStep": 3,
    "status": 2,
    "createDate": "2025-01-12 17:42:19",
    "userId": "1828437318791659522",
    "upImageUrl": "https://mock.png",
    "promptId": "ef303479-d43c-4cfb-b78a-d6b813ff3488",
    "imgRecords": [
      "https://mock.png",
      "https://mock.png",
      "https://mock.png"
    ]
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}


Drawing history:

GET
Drawing History
URL: https://api.sculptok.com/api-open/image/page
Method: GET
Request Parameters
limit
Optional
number
The number of returns of the drawing history
page
Optional
number
The postion of page
Response Fields
imgUrl
string
The image URL of generated depth-map.
Code Examples
Request Params
Copy
{
  "page": 1,
  "limit": 5
}
Request Headers
Copy
{
  "Content-Type": "application/json",
  "apikey": "your_api_key"
}
Success Response
Copy
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 1,
    "list": [
      {
        "id": "1878377197232390146",
        "userId": "1828437318791659522",
        "imgUrl": "https://mock.png",
        "createDate": "2025-01-12 17:43:17"
      }
    ]
  }
}
Error Response
Copy
{
  "code": 401,
  "msg": "Unauthorized",
  "data": null
}




My api key:

241a19123be54c60ac7a7251fafb588f