import React, { useState } from 'react';
import { Search, Mail, Calendar, CheckCircle, Loader2 } from 'lucide-react';

export default function SendGridCampaignChecker() {
  const [emailAddress, setEmailAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkCampaigns = async () => {
    if (!emailAddress || !apiKey) {
      setError('Please enter both email address and API key');
      return;
    }

    setLoading(true);
    setError('');
    setCampaigns([]);

    try {
      // Query all messages sent to this email address
      const query = `to_email="${emailAddress}"`;
      const activityResponse = await fetch(
        `http://localhost:3001/api/messages?query=${encodeURIComponent(query)}&limit=1000`,
        {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!activityResponse.ok) {
        throw new Error(`Failed to fetch email activity: ${activityResponse.status}`);
      }

      const activityData = await activityResponse.json();
      const messages = activityData.messages || [];

      if (messages.length === 0) {
        setCampaigns([]);
        return;
      }

      // Group messages by campaign/subject and get the most recent activity for each
      const campaignMap = new Map();
      
      messages.forEach(message => {
        const subject = message.subject || 'No Subject';
        const msgId = message.msg_id || '';
        
        // Extract campaign identifier (could be from msg_id or use subject as fallback)
        const campaignKey = subject;
        
        if (!campaignMap.has(campaignKey)) {
          campaignMap.set(campaignKey, {
            name: subject,
            status: message.status,
            sendAt: message.last_event_time,
            lastActivity: message.last_event_time,
            from: message.from_email,
            events: [message.events?.[message.events.length - 1]?.event_name || 'sent']
          });
        } else {
          // Update with most recent activity
          const existing = campaignMap.get(campaignKey);
          if (new Date(message.last_event_time) > new Date(existing.lastActivity)) {
            existing.lastActivity = message.last_event_time;
          }
          // Add event if new
          const latestEvent = message.events?.[message.events.length - 1]?.event_name;
          if (latestEvent && !existing.events.includes(latestEvent)) {
            existing.events.push(latestEvent);
          }
        }
      });

      // Convert map to array and sort by most recent
      const campaignResults = Array.from(campaignMap.values())
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

      setCampaigns(campaignResults);
    } catch (err) {
      setError(err.message || 'An error occurred while checking campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">SendGrid Campaign Checker</h1>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SendGrid API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="SG.xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === 'Enter' && checkCampaigns()}
              />
            </div>

            <button
              onClick={checkCampaigns}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking Emails...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Emails
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!loading && !error && campaigns.length === 0 && emailAddress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              No emails found for this email address.
            </div>
          )}

          {campaigns.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Emails Received ({campaigns.length})
              </h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {campaigns.map((campaign, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border-2 bg-green-50 border-green-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-800">
                            {campaign.name}
                          </h3>
                        </div>
                        
                        <div className="text-sm text-gray-600 ml-7">
                          <p>From: <span className="font-medium">{campaign.from}</span></p>
                          {campaign.sendAt && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Sent: {new Date(campaign.sendAt).toLocaleString()}
                            </p>
                          )}
                          {campaign.lastActivity && (
                            <p className="text-green-600">
                              Last activity: {new Date(campaign.lastActivity).toLocaleString()}
                            </p>
                          )}
                          {campaign.events && campaign.events.length > 0 && (
                            <p className="text-sm">
                              Events: <span className="font-medium">{campaign.events.join(', ')}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Your API key needs read permissions for Email Activity</p>
          <p className="mt-1">Note: You must have Email Activity History enabled in SendGrid</p>
        </div>
      </div>
    </div>
  );
}
