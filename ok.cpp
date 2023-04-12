class Solution {
public:
    int countsetbits(int n)
    {
        int c=0;
        while(n)
        {
            if(n%2!=0)
            c++;
            n/=2;
        }
        return c;
    }
    vector<int> fn(vector<int>& arr) {
        map<int, vector<int>>mp;
        vector<int>v;
        sort(arr.begin(), arr.end());
        for(int i=0; i<arr.size(); i++)
        mp[countsetbits(arr[i])].push_back(arr[i]);
        for(auto it=mp.begin(); it!=mp.end(); it++)
        {
            for(int a:it->second)
            v.push_back(a);
        }
        return v;
    }
};