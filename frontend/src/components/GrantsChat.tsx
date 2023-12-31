import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Grid, TextField, Button, List, ListItem, ListItemText, Paper, Box, Typography, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Opportunity } from '../types/apiTypes';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

export default function GrantsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedOpportunities, setSelectedOpportunities] = useState<Opportunity[]>(location.state?.selectedOpportunities ?? []);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<Message>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedOpportunities.length === 0) {
      const rootUrl: string = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8000";
      const ids: string[] = searchParams.getAll("id")
      fetch(`${rootUrl}/opportunities/?id=${ids.join("&id=")}`)
        .then(response => response.json())
        .then(result => result["items"] ?? [])
        .then(setSelectedOpportunities);
    }
  }, [searchParams, selectedOpportunities])

  // Filter key presses and send message if the use presses Enter
  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
      chatInputRef.current?.blur(); // Blur focus on text field to close mobile keyboard
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newUserMessage: Message = { type: 'user', text: chatInput };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);

    setChatInput('');

    // TODO: Handle multiple opportunities
    const top_opportunity = selectedOpportunities[0]

    const rootUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8000";
    if (top_opportunity !== null)
    fetch(`${rootUrl}/chat/`,
      {
        method: "POST",
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          opportunity_id: top_opportunity.OpportunityID,
          messages: [...messages, newUserMessage],
        }),
      })
      .then(response => {
        return response.json()
      })
      .then(response => setMessages(prevMessages => [...prevMessages, {type: 'bot', text: response.content}]));
  };

  // Custom styling for the message bubbles
  const messageBubble = (type: 'user' | 'bot') => ({
    maxWidth: '70%',
    padding: '10px',
    borderRadius: '15px',
    margin: '5px 0',
    color: 'white',
    display: 'inline-block',
    wordWrap: 'break-word' as 'break-word', // Type assertion for 'wordWrap' property
    bgcolor: type === 'user' ? 'primary.main' : 'grey.500',
    alignSelf: type === 'user' ? 'end' : 'start',
    textAlign: type === 'user' ? 'right' as 'right' : 'left' as 'left' // Type assertion for 'textAlign' property
  });

  // TODO: This should be global somewhere
  const footerHeight: string = '100px'; // Adjust the value according to your footer's height

  return (
    <Box sx={{ pb: footerHeight, width: '100%' }}>
      <Grid container spacing={2} sx={{ p: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Selected Grants
            </Typography>
            <Divider />
            <List>
              {selectedOpportunities.map(opportunity => (
                <ListItem key={opportunity.OpportunityID}>
                  <ListItemText primary={opportunity.OpportunityTitle} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Chat with Grants
            </Typography>
            <Divider />
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <List sx={{ padding: 0 }}>
                {messages.map((message, index) => (
                  <ListItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: message.type === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Box sx={messageBubble(message.type)}>
                      {message.text}
                    </Box>
                    <div ref={messagesEndRef} />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                inputRef={chatInputRef}
                fullWidth
                variant="outlined"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here"
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSendMessage}
                sx={{ width: '100%' }}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
