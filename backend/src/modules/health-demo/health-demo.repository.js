const HealthDemoItem = require('../../models/HealthDemoItem.model.js');

/**
 * WHY a repository layer:
 * Same rationale as endpoint.repository.js — the service layer owns
 * business rules, this layer owns Mongoose queries only, isolated so the
 * service is easy to test and ODM-specific code stays in one place.
 */
const healthDemoRepository = {
  /**
   * Creates a new demo item. Always scoped to the owning user.
   */
  createItem(data) {
    return HealthDemoItem.create(data);
  },

  /**
   * Returns paginated demo items belonging to a user.
   */
  findItems(filter, { sort, skip, limit }) {
    return HealthDemoItem.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  /**
   * Counts demo items matching a filter.
   */
  countItems(filter) {
    return HealthDemoItem.countDocuments(filter);
  },

  /**
   * Finds a single demo item owned by the user.
   */
  findByIdAndUser(itemId, userId) {
    return HealthDemoItem.findOne({
      _id: itemId,
      userId,
    });
  },

  /**
   * Updates a demo item (full or partial — controller/service decide which
   * validation schema applies).
   */
  updateItem(itemId, data) {
    return HealthDemoItem.findByIdAndUpdate(
      itemId,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  },

  /**
   * Deletes a demo item.
   */
  deleteItem(itemId) {
    return HealthDemoItem.findByIdAndDelete(itemId);
  },
};

module.exports = healthDemoRepository;
