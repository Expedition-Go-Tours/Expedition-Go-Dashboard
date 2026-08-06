import api from "@/lib/axios";

/**
 * Create a new product/tour
 * Accepts either a plain JSON object (legacy) or a FormData (multipart with files).
 * @param {Object|FormData} payload
 * @returns {Promise} Axios response
 */
export const createProduct = (payload) => api.post("/tours", payload);

/**
 * Update an existing product/tour
 * Accepts either a plain JSON object (legacy) or a FormData (multipart with files).
 * @param {string} id - Product ID
 * @param {Object|FormData} payload
 * @returns {Promise} Axios response
 */
export const updateProduct = (id, payload) => api.patch(`/tours/${id}`, payload);

/**
 * Fetch a single product/tour by ID
 * @param {string} id - Product ID
 * @returns {Promise} Axios response
 */
export const getProduct = (id) => api.get(`/tours/${id}`);

/**
 * List all products/tours (public, ACTIVE only)
 * @param {Object} params - Query params (page, limit, status, etc.)
 * @returns {Promise} Axios response
 */
export const listProducts = (params = {}) => api.get("/tours", { params });

/**
 * List supplier's own products/tours (authenticated, all statuses)
 * @param {Object} params - Query params (page, limit, status, etc.)
 * @returns {Promise} Axios response
 */
export const listMyProducts = (params = {}) => api.get("/tours/supplier/my-tours", { params });

/**
 * Fetch a single product by ID for the supplier (includes DRAFT/INACTIVE tours)
 * Falls back to fetching from supplier's own tours list if public GET fails
 * @param {string} id - Product ID
 * @returns {Promise} Axios response
 */
export const getMyProduct = async (id) => {
  try {
    const res = await api.get(`/tours/${id}`);
    return res;
  } catch (err) {
    if (err.response?.status === 404) {
      const listRes = await api.get(`/tours/supplier/my-tours`, { params: { limit: 100 } });
      const tours = listRes.data?.data?.tours || [];
      const tour = tours.find((t) => t.id === id);
      if (!tour) throw err;
      return { data: { status: "success", data: { tour } } };
    }
    throw err;
  }
};

/**
 * Fetch the pending draft snapshot + diff for a product the supplier owns.
 * Returns the merged draft content (live + pending edits) so the builder can
 * continue editing exactly what an admin will review.
 * @param {string} id - Product ID
 * @returns {Promise} Axios response
 */
export const getTourDraft = (id) => api.get(`/tours/${id}/draft`);

/**
 * Upload photos to Cloudinary (standalone, no tour creation)
 * @param {FormData} formData - FormData with `photos` field containing File[]
 * @returns {Promise} Axios response with { data: { photos: string[] } }
 */
export const uploadPhotos = (formData) =>
  api.post('/tours/upload-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipGlobalErrorHandler: true,
  });

/**
 * Delete a product/tour
 * @param {string} id - Product ID
 * @returns {Promise} Axios response
 */
export const deleteProduct = (id) => api.delete(`/tours/${id}`);

/**
 * Check if supplier has a verified payout method
 * @returns {Promise<boolean>} True if supplier has verified payout method
 */
export const hasVerifiedPayoutMethod = async () => {
  try {
    const res = await api.get('/payout-methods/my-methods');
    const methods = res.data?.data?.payoutMethods || [];
    return methods.some(m => m.verified === true);
  } catch {
    return false;
  }
};

/**
 * Submit a product/tour for admin review (replaces direct publishing)
 * Sets status to PENDING_APPROVAL and notifies the admins.
 * The full submitted payload is passed so the server persists + validates
 * exactly what the supplier submitted (no stale stored draft).
 * @param {string} id - Product ID
 * @param {object} [payload] - Current builder state (buildPayload output)
 * @returns {Promise} Axios response
 */
export const submitProductForReview = (id, payload) => api.post(`/tours/${id}/submit-for-review`, payload);

/**
 * Request a new keyword to be added to the pre-approved list
 * @param {string} keyword
 * @returns {Promise} Axios response
 */
export const requestKeyword = (keyword) => api.post('/keywords/request', { keyword });

/**
 * Clean up uploaded but unsaved media URLs from Cloudinary
 * @param {string[]} urls - Cloudinary URLs to clean up if still pending
 * @returns {Promise} Axios response
 */
export const cleanupMediaUrls = (urls) =>
  api.delete('/media/cleanup', { data: { urls } }).catch(() => {});
