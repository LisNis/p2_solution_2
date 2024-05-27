document.addEventListener("DOMContentLoaded", function() {
    const teamNameForm = document.getElementById("team-name-form");
    const teamNameInput = document.getElementById("team-name-input");
    const teamMemberForm = document.getElementById("team-member-form");
    const confirmButton = document.getElementById("confirm-team");
    const teamNameContainer = document.getElementById("team-name-container");
    const teamMembersContainer = document.getElementById("team-members-container");

    let teamName = "";
    let members = [];

    teamNameForm.addEventListener("submit", function(event) {
        event.preventDefault();
        teamName = teamNameInput.value;
        displayTeamName();
        teamNameInput.disabled = true;
        teamMemberForm.style.display = "block";
    }); 
  

    function displayTeamName() {
        const teamNameElement = document.createElement("h2");
        teamNameElement.textContent = "Team: " + teamName;
        teamNameContainer.appendChild(teamNameElement);

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove Team";
        removeButton.classList.add("remove-btn");
        removeButton.id = "remove-team-btn";
        teamNameContainer.appendChild(removeButton);

        // it shows confirm button after displaying team members
        confirmButton.style.display = "block";
    }

    // removing the team
    teamNameContainer.addEventListener("click", function(event) {
        if (event.target.id === "remove-team-btn") {
            teamNameContainer.innerHTML = ""; 
            members = []; 
            teamNameInput.disabled = false; 
            confirmButton.style.display = "none";
        }
    });

    teamMemberForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const memberName = document.getElementById("member-name-input").value;
        members.push(memberName);
        displayTeamMembers();
        teamMemberForm.reset();
    });

    function displayTeamMembers() {
        teamMembersContainer.innerHTML = ""; // Clear previous list

        members.forEach(function(member, index) {
            const memberElement = document.createElement("div");
            memberElement.textContent = member;

            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.classList.add("remove-btn");
            removeButton.dataset.index = index;

            memberElement.appendChild(removeButton);
            teamMembersContainer.appendChild(memberElement);
        });
    }

    //  remove buttons
    teamMembersContainer.addEventListener("click", function(event) {
        if (event.target.classList.contains("remove-btn")) {
            const index = parseInt(event.target.dataset.index);
            members.splice(index, 1);
            displayTeamMembers();
        }
    });

    // confirm button 
    confirmButton.addEventListener("click", function() {
        const username = localStorage.getItem('username'); // get the username from local storage
        const teamData = {
            teamName,
            members,
            username
        };

        fetch('/create-team', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(teamData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Team creation confirmed!");
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while creating the team.");
        });
        window.location.href = "/groups";
    });
});
