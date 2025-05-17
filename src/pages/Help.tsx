import { Mail, Twitter } from 'lucide-react';

const Help = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Help & Support</h1>
          
          <div className="space-y-8">
            {/* Contact Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Us</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <a 
                    href="mailto:ankitkumar9864@gmail.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ankitkumar9864@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Twitter className="h-5 w-5 text-gray-500" />
                  <a 
                    href="https://x.com/snobby_coder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    @snobby_coder
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2">How do I reset my password?</h3>
                  <p className="text-gray-600">You can reset your password by going to the Settings page and clicking on the Security tab.</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2">How do I update my profile information?</h3>
                  <p className="text-gray-600">You can update your profile information in the Settings page under the Profile tab.</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2">How do I manage my inventory?</h3>
                  <p className="text-gray-600">You can manage your inventory by going to the Inventory page where you can add, edit, and delete items.</p>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Support Hours</h2>
              <p className="text-gray-600">
                We typically respond to support requests within 24-48 hours during business days.
                For urgent matters, please reach out through our contact channels above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 