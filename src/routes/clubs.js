const { Router } = require('express');
const { getAll, getOne, create, update, remove, join, leave } = require('../controllers/clubsController');
const members = require('../controllers/clubMembersController');
const books = require('../controllers/clubBooksController');
const polls = require('../controllers/clubPollsController');
const reviews = require('../controllers/clubReviewsController');
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

// Shared reading list (FR-3, Task-3)
router.get('/:id/books', loadClub, requireRole(), books.getAll);

router.post('/:id/books', loadClub, requireRole(), books.create);

router.put('/:id/books/:bookId', loadClub, requireRole(), books.update);

router.delete('/:id/books/:bookId', loadClub, requireRole(), books.remove);

// Voting for the book of the month (FR-4, Task-4)
router.get('/:id/polls', loadClub, requireRole(), polls.getAll);

router.post('/:id/polls', loadClub, requireRole('owner', 'moderator'), polls.create);

router.post('/:id/polls/:pollId/options', loadClub, requireRole(), polls.propose);

router.post('/:id/polls/:pollId/vote', loadClub, requireRole(), polls.vote);

router.post('/:id/polls/:pollId/close', loadClub, requireRole('owner', 'moderator'), polls.close);

// Club reviews and ratings (FR-5)
router.get('/:id/books/:bookId/reviews', loadClub, requireRole(), reviews.getAll);

router.post('/:id/books/:bookId/reviews', loadClub, requireRole(), reviews.upsert);

router.delete('/:id/books/:bookId/reviews/:reviewId', loadClub, requireRole(), reviews.remove);

module.exports = router;
