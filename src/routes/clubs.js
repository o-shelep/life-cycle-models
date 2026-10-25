const { Router } = require('express');
const { getAll, getOne, create, update, remove, join, leave } = require('../controllers/clubsController');
const members = require('../controllers/clubMembersController');
const authenticate = require('../middleware/auth');
const { loadClub, requireRole } = require('../middleware/clubAccess');

const router = Router();

router.use(authenticate);

router.get('/', getAll);

router.post('/', create);

router.get('/:id', loadClub, getOne);

router.put('/:id', loadClub, requireRole('owner'), update);

router.delete('/:id', loadClub, requireRole('owner'), remove);

router.post('/:id/join', loadClub, join);

router.post('/:id/leave', loadClub, leave);

// Members (FR-2, NFR-3)
router.get('/:id/members', loadClub, requireRole(), members.getAll);

router.post('/:id/invitations', loadClub, requireRole('owner', 'moderator'), members.invite);

router.post('/:id/invitations/decline', loadClub, members.declineInvitation);

router.post('/:id/requests/:userId/approve', loadClub, requireRole('owner', 'moderator'), members.approveRequest);

router.post('/:id/requests/:userId/reject', loadClub, requireRole('owner', 'moderator'), members.rejectRequest);

router.put('/:id/members/:userId/role', loadClub, requireRole('owner'), members.changeRole);

router.delete('/:id/members/:userId', loadClub, requireRole('owner', 'moderator'), members.removeMember);

module.exports = router;
