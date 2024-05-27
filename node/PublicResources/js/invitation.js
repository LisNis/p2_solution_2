const invitationsContainer = document.querySelector('.invitation');
const loggedInUser = localStorage.getItem("username");

generateInvitationsForUser(loggedInUser);

// Function to add invitations to the invitation page
function generateInvitationsForUser(username) {
    fetch('../users.json')
        .then(response => response.json())
        .then(users => {
            const invitationsContainer = document.querySelector('.invitation');
            const user = users.find(user => user.username === username);

            if (user) {
                const invitations = user.invitations;

                invitations.forEach(invitation => {
                    const newInvitation = document.createElement('div');
                    newInvitation.classList.add('invitation-bar');

                    newInvitation.innerHTML = `
                        <p>You have been invited to group: "${invitation}"</p>
                        <button class="accept-btn" data-invitation="${invitation}">Accept</button>
                        <button class="decline-btn" data-invitation="${invitation}">Decline</button>
                    `;

                    const acceptButton = newInvitation.querySelector('.accept-btn');
                    const declineButton = newInvitation.querySelector('.decline-btn');

                    acceptButton.addEventListener('click', (event) => {
                        const invitation = event.target.dataset.invitation;
                    
                        // Construct the data object to send to the server
                        const userData = {
                            username: loggedInUser,
                            action: 'accept',
                            invitation: invitation
                        };
                    
                        // Send the data to the server
                        updateUserData(userData);
                    
                        // Remove the invitation from UI
                        newInvitation.remove();
                    
                        // Optionally, perform any other actions
                        console.log(`Accepted invitation to group: "${invitation}"`);
                    });
                    

                    declineButton.addEventListener('click', (event) => {
                        const invitation = event.target.dataset.invitation;
                    
                        // Construct the data object to send to the server
                        const userData = {
                            username: loggedInUser,
                            action: 'decline',
                            invitation: invitation
                        };
                    
                        // Send the data to the server
                        updateUserData(userData);
                    
                        // Remove the invitation from UI
                        newInvitation.remove();
                    
                        // Optionally, perform any other actions
                        console.log(`Declined invitation to group: "${invitation}"`);
                    });

                    invitationsContainer.appendChild(newInvitation);
                });
            } else {
                console.error('User not found:', username);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Function to send a POST request to update the user data on the server
function updateUserData(userData) {
    fetch('/update-user-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update user data');
        }
        console.log('User data updated successfully');
    })
    .catch(error => {
        console.error('Error updating user data:', error);
    });
}
