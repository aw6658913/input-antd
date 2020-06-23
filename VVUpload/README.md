## 概况

基于 antdesign 的 upload 组件封装

其中视频播放使用 react-player（https://github.com/CookPete/react-player） 上传视频使用七牛云

# 使用前准备

安装七牛组件：yarn add qiniu-js 安装 reace-player： yarn add react-player

# 使用示例

```tsx
import react, { useState } 'react';
import VVUpload from '@/components/VVUpload';

const Demo = (props: any) => {
    const data = [
        {
            index: 0,
            url: '',
            key: ''
        }
    ];

    const [fileList, setFileList] = useState<Array<any>>(data);

    const onChange = (list: Array<any>) => {
        setFileList(list || []);
    };

    return (
        <VVUpload
            maxNum={2}
            size={10}
            fileList={fileList}
            onChange={onChange}
        />
    )
}
```
