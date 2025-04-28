/**
 * @typedef {Object} SaleItem
 * @property {string} product - The product UUID
 * @property {number} quantity - The quantity of the product
 * @property {number} stockLimit - The maximum available stock for this product
 */

/**
 * Class that manages the sale creation form functionality
 * @class SaleFormManager
 */
class SaleFormManager {
  /**
   * Initialize the sale form manager
   * @constructor
   */
  constructor() {
    /**
     * Array of sale items
     * @type {Array<SaleItem>}
     */
    this.items = [{ product: "", quantity: 1, stockLimit: 1 }];
  }

  /**
   * Adds a new empty item to the form
   * @returns {void}
   */
  addItem() {
    this.items.push({ product: "", quantity: 1, stockLimit: 1 });
  }

  /**
   * Removes an item from the form by index
   * @param {number} index - The index of the item to remove
   * @returns {void}
   */
  removeItem(index) {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  /**
   * Updates the stock limit for an item based on the selected product
   * @param {number} index - The index of the item to update
   * @param {Event} event - The change event from the product select element
   * @returns {void}
   */
  updateStockLimit(index, event) {
    const select = event.target;
    const option = select.selectedOptions[0];
    if (option && option.dataset.stock) {
      this.items[index].stockLimit = parseInt(option.dataset.stock);
      if (this.items[index].quantity > this.items[index].stockLimit) {
        this.items[index].quantity = this.items[index].stockLimit;
      }
    }
  }

  /**
   * Gets the form data for submission
   * @returns {Array} - Array of sale items
   */
  getFormData() {
    return this.items
      .filter((item) => item.product)
      .map((item) => ({
        product_id: item.product,
        quantity: item.quantity,
      }));
  }
}

/**
 * Initialize the Alpine.js sale form component
 * @returns {SaleFormManager} - An instance of the SaleFormManager class
 */
function initSaleForm() {
  return new SaleFormManager();
}
