// Posting site
const postButton = document.getElementById("post-btn");
const inputElement = document.getElementById("input-post");
const displayElement = document.getElementById("displayText");

// Bot send messages
const chatInput = document.querySelector('.chat-input textarea');
const sendTextBtn = document.querySelector('.chat-input button');
const chatBox = document.querySelector('.chatbox');

// Bot open and close chat
const botToggler = document.querySelector('.bot-toggler');
const botCloseBtn = document.querySelector('.close-btn');

document.addEventListener('DOMContentLoaded', function() {
    fetch('/posts')
    .then(response => response.json())
    .then(posts => renderPosts(posts))
    .catch(error => console.error('There was a problem with the fetch operation:', error));
});

function renderPosts(posts) {
    const postList = document.querySelector('.container');
    postList.innerHTML = '';
    const pinnedPosts = posts.filter(post => post.pinned);
    pinnedPosts.forEach(post => {
        const postElement = createPostElement(post);
        postList.prepend(postElement); 
    });

    const otherPosts = posts.filter(post => !post.pinned);
    otherPosts.forEach(post => {
        const postElement = createPostElement(post);
        postList.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.dataset.index = post.index; // Set index as data attribute
    postElement.dataset.id = post.id;
    if (post.pinned) {
        postElement.classList.add('pinned-post');
    }

    const postHeader = document.createElement('div');
    postHeader.classList.add('postheader');

    const userInformation = document.createElement('div');
    userInformation.classList.add('user-information');

    const usernameSpan = document.createElement('span');
    usernameSpan.id = 'username';
    usernameSpan.textContent = post.username || 'Unknown';
    userInformation.appendChild(usernameSpan);

    const pointSpan = document.createElement('span');
    pointSpan.id = 'point';
    pointSpan.textContent = '•';
    userInformation.appendChild(pointSpan);

    const dateSpan = document.createElement('span');
    dateSpan.id = 'date';
    dateSpan.textContent = post.date || 'Unknown date';
    userInformation.appendChild(dateSpan);

    const timeSpan = document.createElement('span');
    timeSpan.id = 'timestamp';
    timeSpan.textContent = post.timestamp || 'Unknown time';
    userInformation.appendChild(timeSpan);

    postHeader.appendChild(userInformation);

    const postContent = document.createElement('div');
    postContent.classList.add('post-content');

    const titleHeading = document.createElement('h3');
    titleHeading.id = 'title';
    titleHeading.textContent = post.title || 'No title';
    postContent.appendChild(titleHeading);

    const contentParagraph = document.createElement('p');
    contentParagraph.textContent = post.content || 'No content';
    postContent.appendChild(contentParagraph);

    const tagsDiv = document.createElement('div');
    tagsDiv.classList.add('tags-container');
    tagsDiv.textContent = (post.tags || []).join(' ');
    postContent.appendChild(tagsDiv);

    const thumbsUpButton = document.createElement('button');
    thumbsUpButton.innerHTML = '&#128077;';
    thumbsUpButton.classList.add('thumbs-up-btn');

    const thumbsDownButton = document.createElement('button');
    thumbsDownButton.innerHTML = '&#128078;';
    thumbsDownButton.classList.add('thumbs-down-btn');

    const likeCount = document.createElement('span');
    likeCount.classList.add('post-rating-count');
    likeCount.textContent = post.likes || 0;

    const dislikeCount = document.createElement('span');
    dislikeCount.classList.add('post-rating-count');
    dislikeCount.textContent = post.dislikes || 0;

    // Disable buttons if already liked/disliked
    const username = localStorage.getItem("username");
    const userLikes = JSON.parse(localStorage.getItem('userLikes')) || {};
    const userDislikes = JSON.parse(localStorage.getItem('userDislikes')) || {};

    if (userLikes[post.id]) {
        thumbsUpButton.classList.add('clicked');
        thumbsDownButton.disabled = true;
    }
    if (userDislikes[post.id]) {
        thumbsDownButton.classList.add('clicked');
        thumbsUpButton.disabled = true;
    }

    thumbsUpButton.addEventListener('click', async () => {
        if (thumbsUpButton.classList.contains('clicked')) {
            likeCount.textContent = Number(likeCount.textContent) - 1;
            thumbsUpButton.classList.remove('clicked');
            thumbsDownButton.disabled = false;
            delete userLikes[post.id];
            localStorage.setItem('userLikes', JSON.stringify(userLikes));
            await fetch(`/posts/${post.id}/unlike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
        } else {
            likeCount.textContent = Number(likeCount.textContent) + 1;
            thumbsUpButton.classList.add('clicked');
            thumbsDownButton.disabled = true;
            userLikes[post.id] = true;
            localStorage.setItem('userLikes', JSON.stringify(userLikes));
            await fetch(`/posts/${post.id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
        }
    });

    thumbsDownButton.addEventListener('click', async () => {
        if (thumbsDownButton.classList.contains('clicked')) {
            dislikeCount.textContent = Number(dislikeCount.textContent) - 1;
            thumbsDownButton.classList.remove('clicked');
            thumbsUpButton.disabled = false;
            delete userDislikes[post.id];
            localStorage.setItem('userDislikes', JSON.stringify(userDislikes));
            await fetch(`/posts/${post.id}/undislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
        } else {
            dislikeCount.textContent = Number(dislikeCount.textContent) + 1;
            thumbsDownButton.classList.add('clicked');
            thumbsUpButton.disabled = true;
            userDislikes[post.id] = true;
            localStorage.setItem('userDislikes', JSON.stringify(userDislikes));
            await fetch(`/posts/${post.id}/dislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
        }
    });

    postContent.appendChild(thumbsUpButton);
    postContent.appendChild(likeCount);
    postContent.appendChild(thumbsDownButton);
    postContent.appendChild(dislikeCount);

    postElement.appendChild(postHeader);
    postElement.appendChild(postContent);

    const commentButton = document.createElement("button");
    commentButton.textContent = "Comment";
    commentButton.className = "comment-button";
    commentButton.addEventListener('click', () => {
        const commentSection = postElement.querySelector(".comment-section");
        commentSection.style.display = commentSection.style.display === "none" ? "block" : "none";
    });
    postElement.appendChild(commentButton);

    const commentSection = document.createElement("div");
    commentSection.className = "comment-section";
    commentSection.style.display = "none";

    const commentLabel = document.createElement("div");
    commentLabel.textContent = "Comments:";
    commentLabel.style.textDecoration = "underline";
    commentLabel.style.marginBottom = "5px";
    commentSection.appendChild(commentLabel);

    const commentList = document.createElement("div");
    commentList.className = "comment-list";
    commentSection.appendChild(commentList);

    (post.comments || []).forEach(comment => {
        let commentElement = document.createElement("div");
        const user = comment.username || 'Unknown';
        const content = comment.content || 'No content';
        commentElement.textContent = `${user}: ${content}`;
        commentElement.className = "comment";
        commentList.appendChild(commentElement);
    });

    const commentInput = document.createElement("textarea");
    commentInput.placeholder = "Write your comment here...";
    commentInput.className = "comment-field";
    commentSection.appendChild(commentInput);

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.className = "submit-comment-button";
    submitButton.addEventListener('click', async () => {
        let comment = commentInput.value;
        if (comment.trim() !== "") {
            const username = localStorage.getItem("username") || 'Unknown';
            let newComment = document.createElement("div");
            newComment.textContent = `${username}: ${comment}`;
            newComment.className = "comment";
            commentList.appendChild(newComment);
            commentInput.value = "";
            const commentData = {
                postId: post.id,
                content: comment,
                username: username
            };
            const response = await fetch(`/posts/${post.id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });
            if (!response.ok) {
                console.error('Failed to submit comment:', await response.text());
            }
        }
    });
    commentSection.appendChild(submitButton);
    postElement.appendChild(commentSection);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.id = 'delete-button';
    deleteButton.addEventListener('click', () => {
        showDeleteModal(post);
    });
    postHeader.appendChild(deleteButton);

    const pinnedStatus = document.createElement('span');
    pinnedStatus.textContent = "PINNED";
    pinnedStatus.className = "pinned-status";
    pinnedStatus.style.display = post.pinned ? "block" : "none"; // Only show pinned status if post is pinned
    postHeader.appendChild(pinnedStatus);

    const pinButton = document.createElement("button");
    pinButton.textContent = post.pinned ? "Unpin" : "Pin";
    pinButton.className = "pin-button";
    if (post.pinned) {
        pinButton.classList.add('pinned');
    }
    pinButton.addEventListener('click', async () => {
        const action = post.pinned ? 'unpin' : 'pin';
        const response = await fetch(`/posts/${post.id}/${action}`, { method: 'POST' });
        if (response.ok) {
            if (action === 'pin') {
                pinPost(postElement);
            } else {
                unpinPost(postElement);
            }
            post.pinned = !post.pinned;  // Toggle the pinned state
            pinButton.textContent = post.pinned ? "Unpin" : "Pin";
            pinButton.classList.toggle('pinned');
        } else {
            console.error(`Failed to ${action} post:`, await response.text());
        }
    });
    postHeader.appendChild(pinButton);

    return postElement;
}

function showDeleteModal(postToDelete) {
    const deleteBackdrop = document.getElementById('delete-backdrop'); 
    deleteBackdrop.style.display = 'flex'; 

    const deleteModal = document.querySelector('.delete-modal');
    deleteModal.style.display = 'block';
    const disagreeButton = document.querySelector('.disagree-button');
    const agreeButton = document.querySelector('.agree-button');

    disagreeButton.onclick = function() {
        deleteModal.style.display = 'none';
        deleteBackdrop.style.display = 'none'; 
    };

    agreeButton.onclick = function() {
        deleteModal.style.display = 'none';
        deleteBackdrop.style.display = 'none'; 
        deletePost(postToDelete);
    };
}

function deletePost(postToDelete) {
    fetch(`/posts/${encodeURIComponent(postToDelete.id)}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postToDelete)
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.text();
        })
        .then(data => {
            console.log(data); // Log the server response
            alert('Post deleted successfully');
            fetch('/posts')
                .then(response => response.json())
                .then(posts => renderPosts(posts)) // Refresh post list
                .catch(error => console.error('There was a problem with the fetch operation:', error));
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            alert('There was an error deleting the post');
        });
}


function pinPost(postElement) {
    const postList = document.querySelector('.container');
    const currentlyPinned = postList.querySelector('.pinned-post');

    if (currentlyPinned) {
        currentlyPinned.classList.remove('pinned-post');
        const statusLabel = currentlyPinned.querySelector('.pinned-status');
        if (statusLabel) {
            statusLabel.style.display = 'none';
        }
        const pinButton = currentlyPinned.querySelector('.pin-button');
        if (pinButton) {
            pinButton.classList.remove('pinned'); // Fjern 'pinned' klasse fra tidligere pinned post
        }
    }

    postList.prepend(postElement);
    postElement.classList.add('pinned-post');
    const pinnedLabel = postElement.querySelector('.pinned-status');
    if (pinnedLabel) {
        pinnedLabel.style.display = 'block';
    }
    const pinButton = postElement.querySelector('.pin-button');
    if (pinButton) {
        pinButton.classList.add('pinned'); // Tilføj 'pinned' klasse til ny pinned post
    }
}

function unpinPost(postElement) {
    const postList = document.querySelector('.container');
    postElement.remove(); // Fjern post elementet fra sin nuværende position

    const otherPosts = Array.from(postList.children).filter(child => !child.classList.contains('pinned-post'));
    postElement.classList.remove('pinned-post');

    const pinnedLabel = postElement.querySelector('.pinned-status');
    if (pinnedLabel) {
        pinnedLabel.style.display = 'none';
    }
    const pinButton = postElement.querySelector('.pin-button');
    if (pinButton) {
        pinButton.classList.remove('pinned');
        pinButton.textContent = "Pin";
    }

    // Fjern den blå farve med det samme ved at fjerne 'pinned' klassen
    postElement.classList.remove('pinned-post');
    pinButton.classList.remove('pinned');

    // Find den korrekte position baseret på index
    const postIndex = parseInt(postElement.dataset.index, 10);
    let inserted = false;
    for (let i = 0; i < otherPosts.length; i++) {
        const otherPostIndex = parseInt(otherPosts[i].dataset.index, 10);
        if (postIndex < otherPostIndex) {
            postList.insertBefore(postElement, otherPosts[i]);
            inserted = true;
            break;
        }
    }
    if (!inserted) {
        postList.appendChild(postElement);
    }
}

document.querySelectorAll(".post").forEach(post => {
    const postId = post.dataset.postId;
    const ratings = post.querySelectorAll(".post-rating");
    const likeRating = ratings[0];

    ratings.forEach(rating => {
        const button = rating.querySelector(".post-rating-button");
        const count = rating.querySelector(".post-rating-count");

        button.addEventListener("click", async () => {
            if (rating.classList.contains("post-rating-selected")) {
                return;
            }

            count.textContent = Number(count.textContent) + 1;

            ratings.forEach(rating => {
                if (rating.classList.contains("post-rating-selected")) {
                    const count = rating.querySelector(".post-rating-count");

                    count.textContent = Math.max(0, Number(count.textContent) - 1);
                    rating.classList.remove("post-rating-selected");
                }
            });

            rating.classList.add("post-rating-selected");

            const likeOrDislike = likeRating === rating ? "like" : "dislike";
            const response = await fetch(`/posts/${postId}/${likeOrDislike}`);
            const body = await response.json();
        });
    });
});



//sidebar
function showSidebar(){
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = 'flex';
}
function hideSidebar(){
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = 'none';
}
       
let username = localStorage.getItem("username");

// Check if username is not null
if (username) {
    // Get first letter
    let firstLetter = username.charAt(0);
    
    // Display in the HTML
    document.querySelector(".firstname").textContent = firstLetter;
    document.querySelector(".username").textContent = username;
    document.querySelector(".firstnameProfile").textContent = firstLetter;
}
const postUsername = username;



document.getElementById('submitPost').addEventListener('click', function() {
    let postContent = document.getElementById('textInput').value;

    // looking for title, get input in {}
    const regex = /{([^}]*)}/;
    const match = postContent.match(regex);
    let contentOfPost = postContent; // Assign default value
    let postTitle = '';
    
    if (match !== null) {
        contentOfPost = postContent.replace(match[0], '').trim();
        postTitle = match[1].trim();
    }


    // looking for tags, get input after #
    const regexTags = /#(\w+)/g;
    let matchTags;
    let postTags = [];

    while ((matchTags = regexTags.exec(postContent)) !== null) {
        postTags.push("#" + matchTags[1].trim());
        contentOfPost = contentOfPost.replace(matchTags[0], '').trim();
    }

    console.log("Content of Post:", contentOfPost); // "This is a post with in it."
    console.log("Post Tags:", postTags); // ["multiple", "tags"]

    

    // Get the day, month, and year
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // Month starts at 0
    const year = today.getFullYear();

    // Get the hours and minutes
    const hours = today.getHours();
    let minutes = today.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    // Format the date and time
    const currentDate = `${day}/${month}/${year}`;
    const currentTime = `${hours}:${minutes}`;


    const postData = {
        title: postTitle,
        content: contentOfPost,
        username: postUsername,
        date: currentDate,
        timestamp: currentTime,
        tags: postTags,
    };
    console.log(postUsername);

    // Send the post data to the server
    fetch('/post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log(data); // Log the server response
        alert('Post submitted successfully');
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        alert('There was an error submitting the post');
    });
    document.getElementById('textInput').value = '';
});

document.querySelector('.search-bar').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const postsInContainer = document.querySelectorAll('.container .post');
    
    postsInContainer.forEach(post => {
        const titleElement = post.querySelector('#title');
        const tagsElement = post.querySelector('.tags-container');
        
        const titleMatches = titleElement && titleElement.textContent.toLowerCase().includes(searchTerm);
        const tagsMatch = tagsElement && tagsElement.textContent.toLowerCase().includes(searchTerm);
        
        if (searchTerm.startsWith('#')) {
            // search #, only match tags
            if (tagsMatch) {
            post.classList.remove('hidden');
            } else {
            post.classList.add('hidden');
            }
        } else {
            // match titles
            if (titleMatches) {
            post.classList.remove('hidden');
            } else {
            post.classList.add('hidden');
            }
        }
    });
});


document.querySelectorAll(".post").forEach(post => {
    const postId = post.dataset.postId;
    const ratings = post.querySelectorAll(".post-rating");
    const likeRating = ratings[0];

    ratings.forEach(rating => {
        const button = rating.querySelector(".post-rating-button");
        const count = rating.querySelector(".post-rating-count");

        button.addEventListener("click", async () => {
            if (rating.classList.contains("post-rating-selected")) {
                return;
            }

            count.textContent = Number(count.textContent) + 1;

            ratings.forEach(rating => {
                if (rating.classList.contains("post-rating-selected")) {
                    const count = rating.querySelector(".post-rating-count");

                    count.textContent = Math.max(0, Number(count.textContent) - 1);
                    rating.classList.remove("post-rating-selected");
                }
            });

            rating.classList.add("post-rating-selected");

            const likeOrDislike = likeRating === rating ? "like" : "dislike";
            const response = await fetch(`/posts/${postId}/${likeOrDislike}`);
            const body = await response.json();
        });
    });
});



// Reminder Bot 
//bot send messages
let userMessage;

const createTextLi = (message, className) => {
    const textLi = document.createElement('li');
    textLi.classList.add('chat', className);
    let chatContent = className === 'outgoing' ? `<p>${message}</p>` : `<span class="material-smbols">:0</span><p>${message}</p>`;
    textLi.innerHTML = chatContent;
    return textLi;
}

// not working only giving error
const generateResponse = (incomingTextLi) => {
    const messageElement = incomingTextLi.querySelector('p');

    // check if its right formal if not, error message, css red font and chatbox
    userMessage = chatInput.value;
    console.log(userMessage);

    // bot Countdown
    const newTime = new Date(userMessage);

    if (isNaN(newTime)) {
        messageElement.textContent = "Invalid date format. Please enter a valid date.";
        return;
    }

    function updateCountdown() {
        const currentTime = new Date();
        const diff = newTime - currentTime;

        if (diff <= 0) {
            messageElement.textContent = "Countdown has ended!";
            clearInterval(intervalId);
            alert("The countdown has ended, it's time for a break!");
            return;
        }

        const days = Math.floor(diff / 1000 / 60 / 60 / 24);
        const hours =  Math.floor(diff / 1000 / 60 / 60) % 24;
        const minutes = Math.floor(diff / 1000 / 60) % 60;
        const seconds = Math.floor(diff / 1000) % 60;

        let result = days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds ";

        messageElement.textContent = result;

        // stop the timer when 0, stop timer when writing another one, 
        // delete text in chatbox, after sending
    }

    setInterval(updateCountdown, 1000);
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;

    // append user message to chatbox
    chatBox.appendChild(createTextLi(userMessage, 'outgoing'));
    chatBox.scrollTo(0, chatBox.scrollHeight);

    //chatInput.value = '';

    setTimeout(() => {
        const incomingTextLi = createTextLi("Writing...", 'incoming');
        chatBox.appendChild(incomingTextLi);
        chatBox.scrollTo(0, chatBox.scrollHeight);
        generateResponse(incomingTextLi);
    })
}

sendTextBtn.addEventListener('click', handleChat);

//bot open and close chat
botToggler.addEventListener('click', function() {
    document.body.classList.toggle('show-bot');
});

botCloseBtn.addEventListener('click', function() {
    document.body.classList.remove('show-bot');
});