import { useState, useEffect } from "react";
import { Contract, BrowserProvider } from "ethers";
import { CertAddr, MyGovernorAddr } from "./contract-data/deployedAddresses.json";
import { abi as Govabi } from "./contract-data/MyGovernor.json";
import { abi as Certabi } from "./contract-data/Cert.json";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Toolbar,
  Typography,
  Chip,
  createTheme,
  ThemeProvider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          boxShadow: 'none',
        },
      },
    },
  },
});

const GradientButton = styled(Button)({
  background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
  color: 'white',
  padding: '8px 24px',
  '&:hover': {
    background: 'linear-gradient(135deg, #2563eb 0%, #6d28d9 100%)',
  },
});

const App = () => {
  const [loginState, setLoginState] = useState("Connect");
  const [proposals, setProposals] = useState([]);
  const [pDescription, setPDescription] = useState('');
  const [votingPower, setVotingPower] = useState(100);
  const [balance, setBalance] = useState(1000);
  const [open, setOpen] = useState(false);

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    getEvents();
  }, []);

  const handleSubmit = async () => {
    try {
      const signer = await provider.getSigner();
      const Govinstance = new Contract(MyGovernorAddr, Govabi, signer);
      const Certinstance = new Contract(CertAddr, Certabi, signer);
      const paramsArray = [104, "An", "EDP", "A", "25th June"];
      const transferCalldata = Certinstance.interface.encodeFunctionData("issue", paramsArray);
      const proposeTx = await Govinstance.propose([CertAddr], [0], [transferCalldata], pDescription);
      await proposeTx.wait();
      getEvents();
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getEvents = async () => {
    try {
      const signer = await provider.getSigner();
      const Govinstance = new Contract(MyGovernorAddr, Govabi, signer);
      const filter = Govinstance.filters.ProposalCreated();
      const events = await Govinstance.queryFilter(filter);
      const eventlogs = events.map(event => ({
        proposalId: event.args.proposalId.toString(),
        proposer: event.args.proposer,
        targets: event.args.targets,
        values: event.args.values,
        calldatas: event.args.calldatas,
        description: event.args.description
      }));
      console.log("Fetched proposals:", eventlogs);
      setProposals(eventlogs);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const connectMetaMask = async () => {
    try {
      const signer = await provider.getSigner();
      setLoginState("Connected");
      alert(`Successfully Connected ${signer.address}`);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleVoteFor = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const Govinstance = new Contract(MyGovernorAddr, Govabi, signer);
      const voteTx = await Govinstance.castVote(proposalId, 1); // 1 for "For"
      await voteTx.wait();
      alert("Vote For submitted successfully");
    } catch (error) {
      console.error("Error voting for:", error);
    }
  };

  const handleVoteAgainst = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const Govinstance = new Contract(MyGovernorAddr, Govabi, signer);
      const voteTx = await Govinstance.castVote(proposalId, 0); // 0 for "Against"
      await voteTx.wait();
      alert("Vote Against submitted successfully");
    } catch (error) {
      console.error("Error voting against:", error);
    }
  };

  const handleExecute = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const Govinstance = new Contract(MyGovernorAddr, Govabi, signer);
      const executeTx = await Govinstance.execute(proposalId);
      await executeTx.wait();
      alert("Proposal executed successfully");
    } catch (error) {
      console.error("Error executing proposal:", error);
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBar position="fixed" elevation={0} color="inherit">
          <Toolbar>
            <AccountBalanceIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: 'text.primary' }}>
              DAO Governance
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                icon={<HowToVoteIcon />}
                label={`${votingPower} VP`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<AccountBalanceIcon />}
                label={`${balance} Tokens`}
                color="secondary"
                variant="outlined"
              />
              <GradientButton onClick={connectMetaMask}>
                {loginState}
              </GradientButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
              <span className="gradient-text">Decentralized Governance</span>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Shape the future through transparent and secure voting
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 6 }}>
            {[
              { icon: <HowToVoteIcon />, title: "Active Proposals", value: proposals.length },
              { icon: <GroupIcon />, title: "Total Voters", value: "1,234" },
              { icon: <AccountBalanceIcon />, title: "Voting Power", value: votingPower }
            ].map((stat, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Active Proposals
              </Typography>
              <GradientButton onClick={() => setOpen(true)} startIcon={<AddIcon />}>
                Create Proposal
              </GradientButton>
            </Box>

            {proposals.map((proposal, index) => (
              <Card key={index} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                        {proposal.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {proposal.proposalId.slice(0, 20)}...
                      </Typography>
                    </Box>
                    <Chip label="Active" color="warning" variant="outlined" />
                  </Box>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: '#f0fdf4' }}>
                        <Typography color="success.main">For</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>65%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: '#fef2f2' }}>
                        <Typography color="error.main">Against</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>35%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <Typography color="text.secondary">Quorum</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>75%</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="success" fullWidth onClick={() => handleVoteFor(proposal.proposalId)}>Vote For</Button>
                    <Button variant="contained" color="error" fullWidth onClick={() => handleVoteAgainst(proposal.proposalId)}>Vote Against</Button>
                    <Button variant="contained" color="info" fullWidth onClick={() => handleExecute(proposal.proposalId)}>Execute</Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: { minWidth: '400px' }
          }}
        >
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Proposal Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={pDescription}
              onChange={(e) => setPDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0 }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              Cancel
            </Button>
            <GradientButton onClick={handleSubmit}>
              Create Proposal
            </GradientButton>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default App;
