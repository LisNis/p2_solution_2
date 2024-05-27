const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const url = require('url');

const eventsFilePath = path.join(__dirname, '../PublicResources/data/events.json');
//const postsFilePath = path.join(__dirname, '../PublicResources/data', 'posts.json');
const usersFilePath = path.join(__dirname, '../PublicResources/data', 'users.json');

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/signup') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Buffer to string
        });
        req.on('end', () => {
            const userData = JSON.parse(body);
            const username = userData.username;
            const password = userData.password;

            // Hash the password
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error: Could not hash the password');
                    return;
                }

                // Save the new user
                const newUser = {
                    username: username,
                    password: hashedPassword,
                    group: [],
                    invitations: []
                };

                addNewUserToDatabase(newUser, err => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not save the user');
                    } else {
                        res.writeHead(200);
                        res.end('User signed up successfully');
                    }
                });
            });
        });
    } else if (req.method === 'GET' && req.url.startsWith('/check-username')) {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const username = parsedUrl.searchParams.get('username');
    
        if (!username) {
            res.writeHead(400);
            res.end('Error: Username is required for username availability check');
            return;
        }
    
        // Check if the username already exists in the database
        const databasePath = path.join(__dirname, '../PublicResources/data', 'users.json');
        fs.readFile(databasePath, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                res.writeHead(500);
                res.end('Error: Could not read user database');
                return;
            }
    
            let users;
            try {
                users = data ? JSON.parse(data) : [];
            } catch (parseError) {
                res.writeHead(500);
                res.end('Error: Could not parse user database');
                return;
            }
    
            const existingUser = users.find(user => user.username === username);
            const response = {
                available: !existingUser
            };
    
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
        });
    }
    else if (req.method === 'POST' && req.url === '/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Buffer to string
        });
        req.on('end', () => {
            const loginData = JSON.parse(body);
            const username = loginData.username;
            const password = loginData.password;

            fs.readFile(path.join(__dirname, '../PublicResources/data', 'users.json'), 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error: Could not read user data');
                    return;
                }
                
                try {
                    const users = JSON.parse(data);
                    const user = users.find(user => user.username === username);
                    if (user) {
                        // Compare the hashed password
                        bcrypt.compare(password, user.password, (err, result) => {
                            if (result) {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ message: 'Login successful' }));
                            } else {
                                res.writeHead(401);
                                res.end('Invalid password');
                            }
                        });
                    } else {
                        res.writeHead(404);
                        res.end('User not found');
                    }
                } catch (parseError) {
                    res.writeHead(500);
                    res.end('Error: Could not parse user data');
                }
            });
        });
    } else if (req.method === 'POST' && req.url === '/post') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString(); // Buffer to string
        });
        req.on('end', () => {
            const postData = JSON.parse(body);
            postData.id = Date.now();
            postData.likes = postData.likes || 0;
            postData.dislikes = postData.dislikes || 0;
            postData.comments = [];
            postData.pinned = false;

            appendPostToDatabase(postData, (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error: Could not save the post');
                } else {
                    res.writeHead(200);
                    res.end('Post saved successfully');
                }
            });
        });
    } else if (req.method === 'GET' && req.url === '/posts') {
        fs.readFile(path.join(__dirname, '../PublicResources/data', 'posts.json'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error: Could not fetch posts');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    } else if (req.method === 'POST' && req.url.startsWith('/posts/')) {
        const urlParts = req.url.split('/');
        const postId = parseInt(urlParts[2]);
        const action = urlParts[3];
    
        if (['like', 'dislike', 'unlike', 'undislike'].includes(action)) {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
    
            req.on('end', () => {
                const { username } = JSON.parse(body);
                updatePostLikesOrDislikes(postId, action, username, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not update post likes/dislikes');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Post updated successfully' }));
                    }
                });
            });
        } else if (action === 'comment') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const commentData = JSON.parse(body);
                addCommentToPost(postId, commentData, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not add comment');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Comment added successfully' }));
                    }
                });
            });
        } else if (action === 'pin') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                pinPost(postId, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not pin post');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Post pinned successfully' }));
                    }
                });
            });
        } else if (action === 'unpin') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                unpinPost(postId, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not unpin post');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Post unpinned successfully' }));
                    }
                });
            });
        } else {
            res.writeHead(404);
            res.end('Error: Invalid action');
        }
    }else if (req.url.startsWith('/posts/') && req.method === 'DELETE') {
        const postId = decodeURIComponent(req.url.split('/posts/')[1]);
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const postToDelete = JSON.parse(body);

                fs.readFile(postsFilePath, 'utf8', (error, data) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error: Could not read posts file');
                        console.error('Error reading posts file:', error);
                        return;
                    }

                    let posts = JSON.parse(data);
                    const initialLength = posts.length;
                    posts = posts.filter(post => post.id !== parseInt(postId));

                    if (posts.length === initialLength) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Error: Post not found');
                        console.error('Post not found with ID:', postId);
                        return;
                    }

                    fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf8', (error) => {
                        if (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error: Could not write to posts file');
                            console.error('Error writing to posts file:', error);
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Post deleted successfully');
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error: Invalid JSON');
                console.error('Invalid JSON:', error);
            }
        });
    } else if (req.method === 'POST' && req.url === '/update-user-data') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString(); // Buffer to string
        });
        req.on('end', () => {
            const userData = JSON.parse(body);

            if (userData.action === 'accept') {
                appendUsersToDatabase(userData, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not accept the invitation');
                    } else {
                        res.writeHead(200);
                        res.end('Invitation accepted successfully');
                    }
                });
            } else if (userData.action === 'decline') {
                removeInvitationFromUser(userData, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error: Could not decline the invitation');
                    } else {
                        res.writeHead(200);
                        res.end('Invitation declined successfully');
                    }
                });
            }
        });
    } else if (req.method === 'GET' && req.url === '/users') {
        fs.readFile(path.join(__dirname, '../PublicResources/data', 'users.json'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error: Could not fetch users');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    } else if (req.method === 'POST' && req.url === '/create-team') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const teamData = JSON.parse(body);
            const { teamName, members, username } = teamData;

            fs.readFile(path.join(__dirname, '../PublicResources/data', 'users.json'), 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: 'Error: Could not read user data' }));
                    return;
                }

                const users = JSON.parse(data);

                // Update the group for the user who created the team
                const user = users.find(user => user.username === username);
                if (user) {
                    user.group.push(teamName);
                }

                // Add the group to invitations for all members
                members.forEach(memberName => {
                    const member = users.find(user => user.username === memberName);
                    if (member) {
                        member.invitations.push(teamName);
                    }
                });

                fs.writeFile(path.join(__dirname, '../PublicResources/data', 'users.json'), JSON.stringify(users, null, 2), (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ success: false, message: 'Error: Could not save user data' }));
                    } else {
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, message: 'Team created successfully' }));
                    }
                });
            });
        });
    } else if (req.url === '/events' && req.method === 'GET') {
        fs.readFile(eventsFilePath, 'utf8', (error, data) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error: Could not read events file');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    } else if (req.url === '/events' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const newEvent = JSON.parse(body);

                fs.readFile(eventsFilePath, 'utf8', (error, data) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error: Could not read events file');
                        return;
                    }

                    const events = JSON.parse(data);
                    events.push(newEvent);

                    fs.writeFile(eventsFilePath, JSON.stringify(events, null, 2), 'utf8', (error) => {
                        if (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error: Could not write to events file');
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Event added successfully');
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error: Invalid JSON');
            }
        });
    } else if (req.url.startsWith('/events/') && req.method === 'DELETE') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const eventToDelete = JSON.parse(body);
                const eventDate = decodeURIComponent(req.url.split('/events/')[1]);

                fs.readFile(eventsFilePath, 'utf8', (error, data) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error: Could not read events file');
                        return;
                    }

                    let events = JSON.parse(data);
                    events = events.filter(event => event.date !== eventDate || event.title !== eventToDelete.title);

                    fs.writeFile(eventsFilePath, JSON.stringify(events, null, 2), 'utf8', (error) => {
                        if (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error: Could not write to events file');
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Event deleted successfully');
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error: Invalid JSON');
            }
        });
    } else if (req.method === 'POST' && req.url === '/create-json') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        req.on('end', () => {
            try {
                const { groupName } = JSON.parse(body);
                if (!groupName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Group name is required' }));
                    return;
                }
    
                const filePath = path.join(__dirname, '../PublicResources/data/', `${groupName}.json`);
    
                // Check if the file already exists
                fs.access(filePath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        // File exists, return error response
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'File already exists for this group' }));
                    } else {
                        // File does not exist, create it
                        const data = { group: groupName };
    
                        fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to create file' }));
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, message: 'File created successfully' }));
                        });
                    }
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
     else if (req.method === 'GET' && req.url.startsWith('/user-groups')) {
        const queryObject = url.parse(req.url, true).query;
        const username = queryObject.username;
        
        if (!username) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username is required' }));
            return;
        }
    
        fs.readFile(path.join(__dirname, '../PublicResources/data', 'users.json'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Could not read user data' }));
                return;
            }
    
            const users = JSON.parse(data);
            const user = users.find(user => user.username === username);
    
            if (!user) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User not found' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ groups: user.group }));
            }
        });  
    } else if (req.method === 'POST' && req.url === '/addNewMember') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const teamData = JSON.parse(body);
                const { teamName, members } = teamData;
    
                fs.readFile(path.join(__dirname, '../PublicResources/data', 'users.json'), 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ success: false, message: 'Error: Could not read user data' }));
                        return;
                    }
    
                    const users = JSON.parse(data);
                    let updated = false;
    
                    members.forEach(memberName => {
                        const member = users.find(user => user.username === memberName);
                        if (member) {
                            member.invitations.push(teamName);
                            updated = true;
                        }
                    });
    
                    if (updated) {
                        fs.writeFile(path.join(__dirname, '../PublicResources/data', 'users.json'), JSON.stringify(users, null, 2), (err) => {
                            if (err) {
                                res.writeHead(500);
                                res.end(JSON.stringify({ success: false, message: 'Error: Could not save user data' }));
                            } else {
                                res.writeHead(200);
                                res.end(JSON.stringify({ success: true, message: 'Team created successfully' }));
                            }
                        });
                    } else {
                        res.writeHead(404);
                        res.end(JSON.stringify({ success: false, message: 'No users found to update' }));
                    }
                });
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Error: Invalid JSON' }));
            }
        });
    } else {
        let filePath = req.url === '/' ? '/html/login.html' : req.url;

        if (filePath === '/post') {
            filePath = '/html/post.html';
        } else if (filePath === '/groups') {
            filePath = '/html/groups.html';
        } else if (filePath === '/calendar') {
            filePath = '/html/calendar.html';
        } else if (filePath === '/signup') {
            filePath = '/html/signup.html';
        } else if (filePath === '/coffeebreak') {
            filePath = '/html/coffeebreak.html';
        } else if (filePath === '/invitation') {
            filePath = '/html/invitation.html';
        } else if (filePath === '/create') {
            filePath = '/html/create.html';
        } else if (filePath === '/login') {
            filePath = '/html/login.html';
        } else if (filePath === '/teamcohesion') {
            filePath = '/html/teamcohesion.html';
        }

        filePath = path.join(__dirname, '../PublicResources', filePath);

        fs.readFile(filePath, (error, data) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Error: File not found');
                } else {
                    res.writeHead(500);
                    res.end('Error: Internal Server Error');
                }
            } else {
                let contentType = 'text/plain';
                const ext = path.extname(filePath);
                if (ext === '.html') {
                    contentType = 'text/html';
                } else if (ext === '.css') {
                    contentType = 'text/css';
                } else if (ext === '.js') {
                    contentType = 'text/javascript';
                }

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }
});
// Function to add new user to database
function addNewUserToDatabase(newUser, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'users.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return callback(err);
        }

        let users;
        try {
            users = data ? JSON.parse(data) : [];
        } catch (parseError) {
            return callback(parseError);
        }

        const existingUser = users.find(user => user.username === newUser.username);
        if (existingUser) {
            return callback(new Error('Username already exists'));
        }

        //userData.group = userData.group || [];
        //userData.invitations = userData.invitations || [];

        users.push(newUser);

        fs.writeFile(databasePath, JSON.stringify(users, null, 2), callback);
    });
}

let nextIndex = 0;

function appendPostToDatabase(postData, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'posts.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                data = '[]';
            } else {
                return callback(err);
            }
        }

        const posts = JSON.parse(data);

        postData.likes = postData.likes || 0;
        postData.dislikes = postData.dislikes || 0;
        postData.comments = postData.comments || [];
        postData.pinned = postData.pinned || false;
        postData.likedBy = postData.likedBy || [];
        postData.dislikedBy = postData.dislikedBy || [];
        postData.index = nextIndex++;
        
        posts.push(postData);
        fs.writeFile(databasePath, JSON.stringify(posts, null, 2), callback);
    });
}

function updatePostLikesOrDislikes(postId, action, username, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'posts.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }

        const posts = JSON.parse(data);
        const post = posts.find(post => post.id === postId);

        if (post) {
            // Initialize likedBy and dislikedBy arrays if they are undefined
            post.likedBy = post.likedBy || [];
            post.dislikedBy = post.dislikedBy || [];

            if (action === 'like') {
                if (!post.likedBy.includes(username)) {
                    post.likes = (post.likes || 0) + 1;
                    post.likedBy.push(username);
                    // Ensure the user is removed from dislikedBy array if they switch from dislike to like
                    post.dislikedBy = post.dislikedBy.filter(user => user !== username);
                }
            } else if (action === 'dislike') {
                if (!post.dislikedBy.includes(username)) {
                    post.dislikes = (post.dislikes || 0) + 1;
                    post.dislikedBy.push(username);
                    // Ensure the user is removed from likedBy array if they switch from like to dislike
                    post.likedBy = post.likedBy.filter(user => user !== username);
                }
            }else if (action === 'unlike') {
                if (post.likedBy.includes(username)) {
                    post.likes = Math.max((post.likes || 1) - 1, 0);
                    post.likedBy = post.likedBy.filter(user => user !== username);
                }
            } else if (action === 'undislike') {
                if (post.dislikedBy.includes(username)) {
                    post.dislikes = Math.max((post.dislikes || 1) - 1, 0);
                    post.dislikedBy = post.dislikedBy.filter(user => user !== username);
                }
            }

            fs.writeFile(databasePath, JSON.stringify(posts, null, 2), (writeErr) => {
                if (writeErr) {
                    console.log('Error writing file:', writeErr);
                    return callback(writeErr);
                }
                callback(null);
            });
        } else {
            callback(new Error('Post not found'));
        }
    });
}

function addCommentToPost(postId, commentData, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'posts.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }

        const posts = JSON.parse(data);
        const post = posts.find(post => post.id === postId);

        if (post) {
            if (!post.comments) {
                post.comments = [];
            }
            post.comments.push(commentData);

            fs.writeFile(databasePath, JSON.stringify(posts, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Error writing file:', writeErr);
                    return callback(writeErr);
                }
                console.log('Comment successfully added');
                callback(null);
            });
        } else {
            console.error('Post not found:', postId);
            callback(new Error('Post not found'));
        }
    });
}

// Function to pin a post
function pinPost(postId, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'posts.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }

        const posts = JSON.parse(data);
        const post = posts.find(post => post.id === postId);

        if (post) {
            posts.forEach(p => p.pinned = false); // Unpin all posts
            post.pinned = true; // Pin the selected post

            fs.writeFile(databasePath, JSON.stringify(posts, null, 2), (writeErr) => {
                if (writeErr) {
                    console.log('Error writing file:', writeErr);
                    return callback(writeErr);
                }
                console.log('Post successfully pinned');
                callback(null);
            });
        } else {
            console.log('Post not found:', postId);
            callback(new Error('Post not found'));
        }
    });
}

function appendUsersToDatabase(usersData, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'users.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                data = '[]';
            } else {
                return callback(err);
            }
        }

        let users = JSON.parse(data);

        const index = users.findIndex(user => user.username === usersData.username);

        if (index !== -1) {
            users[index].invitations = users[index].invitations.filter(invitation => invitation !== usersData.invitation);
            users[index].group.push(usersData.invitation);
        } else {
            console.error('User not found:', usersData.username);
        }

        fs.writeFile(databasePath, JSON.stringify(users, null, 2), callback);
    });
}

function removeInvitationFromUser(userData, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'users.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                data = '[]';
            } else {
                return callback(err);
            }
        }

        let users = JSON.parse(data);

        const index = users.findIndex(user => user.username === userData.username);

        if (index !== -1) {
            users[index].invitations = users[index].invitations.filter(invitation => invitation !== userData.invitation);
        } else {
            console.error('User not found:', userData.username);
        }

        fs.writeFile(databasePath, JSON.stringify(users, null, 2), callback);
    });
}
function unpinPost(postId, callback) {
    const databasePath = path.join(__dirname, '../PublicResources/data', 'posts.json');

    fs.readFile(databasePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }

        const posts = JSON.parse(data);
        const post = posts.find(post => post.id === postId);

        if (post) {
            post.pinned = false; // Unpin the selected post

            fs.writeFile(databasePath, JSON.stringify(posts, null, 2), (writeErr) => {
                if (writeErr) {
                    console.log('Error writing file:', writeErr);
                    return callback(writeErr);
                }
                console.log('Post successfully unpinned');
                callback(null);
            });
        } else {
            console.log('Post not found:', postId);
            callback(new Error('Post not found'));
        }
    });
}
const PORT = process.env.PORT || 3241;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});