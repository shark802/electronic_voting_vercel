document.addEventListener("DOMContentLoaded", async function () {
    const electionId = document.querySelector('#election-id').value;
    let faceRecognitionSeviceDomain = ""
    let savedFaceFilename = ""
    try {

        const response = await fetch('/api/face-service-domain');
        const responseObject = await response.json();
        faceRecognitionSeviceDomain = responseObject.faceServiceDomain;

    } catch (error) {
        console.error(error);
    }

    try {

        const response = await fetch('/api/save-face-filename');
        const responseObject = await response.json();

        if (response.ok) {
            savedFaceFilename = responseObject.filename;
        }
    } catch (error) {
        console.error(error);
    }

    const video = document.getElementById('video');
    const messageDiv = document.getElementById('message'); // Get the message display area
    const connectionStatusDiv = document.getElementById('connection-status'); // Get the connection status display area

    navigator.mediaDevices.getUserMedia({
        video: true
    })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Error accessing camera: ", err);
            messageDiv.textContent = "Error accessing camera: " + err.message; // Display error message
        });

    // const socket = new WebSocket(`ws://localhost:8000/ws/authenticate-face`);
    const socket = new WebSocket(`wss://${faceRecognitionSeviceDomain}/ws/authenticate-face`);

    // Update connection status
    socket.onopen = function () {
        connectionStatusDiv.textContent = "Status: Connected";
        connectionStatusDiv.style.backgroundColor = "#d4edda"; // Light green background for connected status
    };

    socket.onerror = function (error) {
        console.error("WebSocket error: ", error);
        connectionStatusDiv.textContent = "WebSocket Error: " + error.message;
        connectionStatusDiv.style.backgroundColor = "#f8d7da"; // Light red background for error
    };

    video.addEventListener('play', function () {
        const SKIP_FAME = 15
        let frameCount = 0;
        const sendFrame = () => {
            if (video.paused || video.ended) return;

            frameCount++;

            if (frameCount < SKIP_FAME) {
                requestAnimationFrame(sendFrame);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameData = canvas.toDataURL('image/jpeg'); // Convert to base64

            // Check if the WebSocket is open before sending
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ image: frameData, filename: savedFaceFilename })); // Send as JSON
            }

            frameCount = 0;
            requestAnimationFrame(sendFrame);
        };
        sendFrame();
    });

    socket.onmessage = async function (event) {
        try {

            const response = JSON.parse(event.data);
            if (response.success) {

                const faceVerified = response.faceVerified ?? false;
                // console.log('face verify result: ', faceVerified);
                await fetch('/api/verified-face/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ faceVerified })
                });

                if (faceVerified) {

                    Swal.fire({
                        title: 'Success!',
                        text: response.message,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {

                        window.location.href = `/ballot/${electionId}`;
                    });
                } else {

                    Swal.fire({
                        title: "Face don't match!",
                        text: response.message,
                        icon: 'error',
                        showCancelButton: true,
                        confirmButtonText: 'Try Again',
                        cancelButtonText: 'OK'
                    }).then((action) => {
                        if (action.isConfirmed) {
                            window.location.reload();
                        } else {
                            window.location.href = '/election';
                        }
                    });
                }

                const authenticationResult = faceVerified ? 'MATCH' : 'NOT MATCH';
                messageDiv.textContent = `Face authentication result: ${authenticationResult}`;

                socket.close();

            } else {

                if (response.error) {
                    Swal.fire({
                        title: 'Something went wrong!',
                        text: response.error,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    }).then(() => {

                        window.location.href = '/election';
                    });
                }

                console.warn(response.message);
                messageDiv.textContent = response.message;
            }

        } catch (error) {
            Swal.fire({
                title: 'Failed!',
                text: `Error on registration`,
                icon: 'error',
                confirmButtonText: 'OK'
            }).then(() => {

                window.location.href = '/election';
            });
        }
    };

    socket.onclose = async function (event) {
        console.log("WebSocket connection closed.");

        // Display the reason for closure
        let reasonMessage = "WebSocket connection closed.";
        if (event.code) {
            reasonMessage += ` Reason: ${event.code}`;
        }

        if (event.reason) {
            reasonMessage += ` Reason message: ${event.reason}`;
        }

        if (event.code !== 1000) {

            Swal.fire({
                title: 'Connection Closed',
                text: reasonMessage,
                icon: 'info',
                confirmButtonText: 'OK'
            }).then(() => {

                window.location.href = '/election';
            });
        }

        // Update connection status
        connectionStatusDiv.textContent = "Status: Disconnected"; // Update status on close
        connectionStatusDiv.style.backgroundColor = "#f8d7da"; // Light red background for disconnected status
    };
});
